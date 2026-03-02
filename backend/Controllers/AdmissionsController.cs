using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdmissionCRM.API.Data;
using AdmissionCRM.API.Models;
using AdmissionCRM.API.Models.DTOs;

namespace AdmissionCRM.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class AdmissionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdmissionsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<object>>> GetAll()
    {
        return await _db.Admissions
            .Include(a => a.Applicant).ThenInclude(ap => ap.Program)
            .Include(a => a.SeatCounter)
            .Select(a => (object)new
            {
                a.Id,
                a.AdmissionNumber,
                ApplicantName = a.Applicant.FirstName + " " + a.Applicant.LastName,
                ApplicantId = a.ApplicantId,
                ApplicationNumber = a.Applicant.ApplicationNumber,
                Program = a.Applicant.Program.Name,
                QuotaType = a.SeatCounter.QuotaType,
                a.FeeStatus,
                a.IsConfirmed,
                a.ConfirmedAt,
                a.AdmissionDate
            }).ToListAsync();
    }

    /// <summary>
    /// Step 1: Allocate seat to applicant (locks the seat atomically)
    /// </summary>
    [HttpPost("allocate"), Authorize(Roles = "Admin,AdmissionOfficer")]
    public async Task<ActionResult<AllocationResultDto>> AllocateSeat(AllocateSeatDto dto)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var applicant = await _db.Applicants
                .Include(a => a.Program)
                .FirstOrDefaultAsync(a => a.Id == dto.ApplicantId);

            if (applicant == null)
                return NotFound(new AllocationResultDto(false, "Applicant not found", null));

            if (applicant.Admission != null)
                return BadRequest(new AllocationResultDto(false, "Seat already allocated to this applicant", null));

            // Lock the counter row
            var counter = await _db.SeatCounters
                .FromSqlRaw("SELECT * FROM SeatCounters WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}", dto.SeatCounterId)
                .FirstOrDefaultAsync();

            if (counter == null)
                return NotFound(new AllocationResultDto(false, "Seat counter not found", null));

            var available = counter.TotalSeats - counter.AllocatedSeats;
            if (available <= 0)
                return BadRequest(new AllocationResultDto(false, $"Quota '{counter.QuotaType}' is full. No seats available.", null));

            // Check JnK if applicable
            if (applicant.IsJnkCandidate)
            {
                var seatMatrix = await _db.SeatMatrices.FindAsync(counter.SeatMatrixId);
                if (seatMatrix != null && seatMatrix.JnkLimit > 0)
                {
                    var progInfo = await _db.Programs.Include(p => p.Department).ThenInclude(d => d.Campus)
                        .FirstOrDefaultAsync(p => p.Id == applicant.ProgramId);
                    if (progInfo != null)
                    {
                        var campus = await _db.Campuses.FindAsync(progInfo.Department.CampusId);
                        var jnkCounter = await _db.JnkCounters
                            .FirstOrDefaultAsync(j => j.InstitutionId == campus!.InstitutionId
                                && j.AcademicYearId == applicant.AcademicYearId);

                        if (jnkCounter != null && jnkCounter.AllocatedCount >= jnkCounter.TotalLimit)
                            return BadRequest(new AllocationResultDto(false, "J&K institution-level limit reached", null));

                        if (jnkCounter != null)
                            jnkCounter.AllocatedCount++;
                    }
                }
            }

            // Increment counter
            counter.AllocatedSeats++;

            // Generate admission number
            var admNumber = await GenerateAdmissionNumber(applicant, counter);

            // Create admission record
            var admission = new Admission
            {
                ApplicantId = applicant.Id,
                SeatCounterId = counter.Id,
                AdmissionNumber = admNumber,
                FeeStatus = "Pending",
                IsConfirmed = false
            };
            _db.Admissions.Add(admission);

            // Update applicant status
            applicant.Status = "SeatAllocated";
            applicant.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new AllocationResultDto(true, "Seat allocated successfully", admNumber));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new AllocationResultDto(false, $"Allocation failed: {ex.Message}", null));
        }
    }

    /// <summary>
    /// Step 2: Update fee status
    /// </summary>
    [HttpPatch("{id}/fee"), Authorize(Roles = "Admin,AdmissionOfficer")]
    public async Task<IActionResult> UpdateFee(int id, UpdateFeeStatusDto dto)
    {
        var admission = await _db.Admissions.FindAsync(id);
        if (admission == null) return NotFound();

        admission.FeeStatus = dto.FeeStatus;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Step 3: Confirm admission (only if fee is paid)
    /// </summary>
    [HttpPost("{id}/confirm"), Authorize(Roles = "Admin,AdmissionOfficer")]
    public async Task<ActionResult<AdmissionDto>> ConfirmAdmission(int id)
    {
        var admission = await _db.Admissions
            .Include(a => a.Applicant)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (admission == null) return NotFound();

        if (admission.FeeStatus != "Paid")
            return BadRequest(new { message = "Admission can only be confirmed after fee is paid" });

        if (admission.IsConfirmed)
            return BadRequest(new { message = "Admission already confirmed" });

        admission.IsConfirmed = true;
        admission.ConfirmedAt = DateTime.UtcNow;
        admission.Applicant.Status = "Confirmed";
        admission.Applicant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new AdmissionDto(admission.Id, admission.AdmissionNumber,
            admission.FeeStatus, admission.IsConfirmed, admission.ConfirmedAt));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> Get(int id)
    {
        var a = await _db.Admissions
            .Include(a => a.Applicant).ThenInclude(ap => ap.Program)
            .Include(a => a.SeatCounter)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (a == null) return NotFound();

        return Ok(new
        {
            a.Id,
            a.AdmissionNumber,
            ApplicantName = a.Applicant.FirstName + " " + a.Applicant.LastName,
            a.ApplicantId,
            ApplicationNumber = a.Applicant.ApplicationNumber,
            Program = a.Applicant.Program.Name,
            QuotaType = a.SeatCounter.QuotaType,
            a.FeeStatus,
            a.IsConfirmed,
            a.ConfirmedAt,
            a.AdmissionDate
        });
    }

    private async Task<string> GenerateAdmissionNumber(Applicant applicant, SeatCounter counter)
    {
        var seatMatrix = await _db.SeatMatrices.FindAsync(counter.SeatMatrixId);
        var academicYear = await _db.AcademicYears.FindAsync(seatMatrix!.AcademicYearId);
        var program = await _db.Programs.FindAsync(applicant.ProgramId);
        var dept = await _db.Departments.FindAsync(program!.DepartmentId);
        var campus = await _db.Campuses.FindAsync(dept!.CampusId);
        var institution = await _db.Institutions.FindAsync(campus!.InstitutionId);

        // Get/increment sequence
        var seq = await _db.AdmissionNumberSequences
            .FirstOrDefaultAsync(s => s.SeatMatrixId == counter.SeatMatrixId && s.QuotaType == counter.QuotaType);

        if (seq == null)
        {
            seq = new AdmissionNumberSequence
            {
                SeatMatrixId = counter.SeatMatrixId,
                QuotaType = counter.QuotaType,
                LastNumber = 1
            };
            _db.AdmissionNumberSequences.Add(seq);
        }
        else
        {
            seq.LastNumber++;
        }

        await _db.SaveChangesAsync();

        // Format: INST/2026/UG/CSE/KCET/0001
        return $"{institution!.Code}/{academicYear!.EndYear}/{program.CourseType}/{program.Code}/{counter.QuotaType}/{seq.LastNumber:D4}";
    }
}
