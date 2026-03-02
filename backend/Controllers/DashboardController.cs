using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdmissionCRM.API.Data;
using AdmissionCRM.API.Models.DTOs;

namespace AdmissionCRM.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get([FromQuery] int? academicYearId)
    {
        var smQuery = _db.SeatMatrices.Include(s => s.SeatCounters).Include(s => s.Program).AsQueryable();
        if (academicYearId.HasValue) smQuery = smQuery.Where(s => s.AcademicYearId == academicYearId);

        var seatMatrices = await smQuery.ToListAsync();

        var totalIntake = seatMatrices.Sum(s => s.TotalIntake);
        var totalAdmitted = await _db.Admissions.CountAsync();
        var totalConfirmed = await _db.Admissions.CountAsync(a => a.IsConfirmed);

        var pendingDocuments = await _db.Applicants
            .CountAsync(a => a.Status == "Applied" || a.Status == "DocumentPending");

        var feePending = await _db.Admissions
            .CountAsync(a => a.FeeStatus == "Pending");

        // Quota summaries across all matrices
        var allCounters = seatMatrices.SelectMany(s => s.SeatCounters).ToList();
        var quotaSummaries = allCounters
            .GroupBy(c => c.QuotaType)
            .Select(g => new QuotaSummaryDto(
                g.Key,
                g.Sum(c => c.TotalSeats),
                g.Sum(c => c.AllocatedSeats),
                g.Sum(c => c.TotalSeats - c.AllocatedSeats)))
            .ToList();

        // Per-program summaries
        var programSummaries = seatMatrices
            .GroupBy(s => new { s.ProgramId, s.Program.Name, s.Program.Code })
            .Select(g => new ProgramSummaryDto(
                g.Key.Name,
                g.Key.Code,
                g.Sum(s => s.TotalIntake),
                g.Sum(s => s.SeatCounters.Sum(c => c.AllocatedSeats))))
            .ToList();

        return Ok(new DashboardDto(
            totalIntake, totalAdmitted, totalConfirmed,
            pendingDocuments, feePending,
            quotaSummaries, programSummaries));
    }

    [HttpGet("seat-availability")]
    public async Task<ActionResult<object>> SeatAvailability([FromQuery] int? academicYearId)
    {
        var q = _db.SeatCounters
            .Include(c => c.SeatMatrix).ThenInclude(sm => sm.Program)
            .Include(c => c.SeatMatrix).ThenInclude(sm => sm.AcademicYear)
            .AsQueryable();

        if (academicYearId.HasValue)
            q = q.Where(c => c.SeatMatrix.AcademicYearId == academicYearId);

        var result = await q.Select(c => new
        {
            c.Id,
            Program = c.SeatMatrix.Program.Name,
            ProgramCode = c.SeatMatrix.Program.Code,
            AcademicYear = c.SeatMatrix.AcademicYear.Name,
            c.SeatMatrix.AdmissionMode,
            c.QuotaType,
            c.TotalSeats,
            c.AllocatedSeats,
            Available = c.TotalSeats - c.AllocatedSeats,
            PercentFilled = c.TotalSeats > 0
                ? Math.Round((double)c.AllocatedSeats / c.TotalSeats * 100, 1)
                : 0
        }).ToListAsync();

        return Ok(result);
    }

    [HttpGet("pending-actions")]
    public async Task<ActionResult<object>> PendingActions()
    {
        var pendingFee = await _db.Admissions
            .Include(a => a.Applicant).ThenInclude(ap => ap.Program)
            .Where(a => a.FeeStatus == "Pending")
            .Select(a => new
            {
                a.Id,
                a.AdmissionNumber,
                ApplicantName = a.Applicant.FirstName + " " + a.Applicant.LastName,
                Program = a.Applicant.Program.Name,
                a.AdmissionDate
            })
            .ToListAsync();

        var pendingDocs = await _db.Applicants
            .Include(a => a.Program)
            .Where(a => a.Status == "Applied" || a.Status == "DocumentPending")
            .Select(a => new
            {
                a.Id,
                a.ApplicationNumber,
                ApplicantName = a.FirstName + " " + a.LastName,
                Program = a.Program.Name,
                a.Status,
                a.CreatedAt
            })
            .ToListAsync();

        return Ok(new { PendingFee = pendingFee, PendingDocuments = pendingDocs });
    }
}
