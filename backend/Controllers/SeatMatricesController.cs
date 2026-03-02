using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdmissionCRM.API.Data;
using AdmissionCRM.API.Models;
using AdmissionCRM.API.Models.DTOs;

namespace AdmissionCRM.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class SeatMatricesController : ControllerBase
{
    private readonly AppDbContext _db;
    public SeatMatricesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<SeatMatrixDto>>> GetAll(
        [FromQuery] int? programId, [FromQuery] int? academicYearId)
    {
        var q = _db.SeatMatrices
            .Include(s => s.Program)
            .Include(s => s.AcademicYear)
            .Include(s => s.SeatCounters)
            .Where(s => s.IsActive);

        if (programId.HasValue) q = q.Where(s => s.ProgramId == programId);
        if (academicYearId.HasValue) q = q.Where(s => s.AcademicYearId == academicYearId);

        return await q.Select(s => MapToDto(s)).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SeatMatrixDto>> Get(int id)
    {
        var sm = await _db.SeatMatrices
            .Include(s => s.Program)
            .Include(s => s.AcademicYear)
            .Include(s => s.SeatCounters)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sm == null) return NotFound();
        return MapToDto(sm);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<SeatMatrixDto>> Create(CreateSeatMatrixDto dto)
    {
        // Validate quota totals
        if (dto.KcetSeats + dto.CometkSeats + dto.ManagementSeats != dto.TotalIntake)
            return BadRequest(new { message = "KCET + COMEDK + Management seats must equal Total Intake" });

        var sm = new SeatMatrix
        {
            ProgramId = dto.ProgramId,
            AcademicYearId = dto.AcademicYearId,
            AdmissionMode = dto.AdmissionMode,
            TotalIntake = dto.TotalIntake,
            KcetSeats = dto.KcetSeats,
            CometkSeats = dto.CometkSeats,
            ManagementSeats = dto.ManagementSeats,
            SnSeats = dto.SnSeats,
            JnkLimit = dto.JnkLimit
        };

        _db.SeatMatrices.Add(sm);
        await _db.SaveChangesAsync();

        // Create seat counters
        var counters = new List<SeatCounter>();
        if (dto.KcetSeats > 0)
            counters.Add(new SeatCounter { SeatMatrixId = sm.Id, QuotaType = "KCET", TotalSeats = dto.KcetSeats });
        if (dto.CometkSeats > 0)
            counters.Add(new SeatCounter { SeatMatrixId = sm.Id, QuotaType = "COMEDK", TotalSeats = dto.CometkSeats });
        if (dto.ManagementSeats > 0)
            counters.Add(new SeatCounter { SeatMatrixId = sm.Id, QuotaType = "Management", TotalSeats = dto.ManagementSeats });
        if (dto.SnSeats > 0)
            counters.Add(new SeatCounter { SeatMatrixId = sm.Id, QuotaType = "Supernumerary", TotalSeats = dto.SnSeats });

        _db.SeatCounters.AddRange(counters);
        await _db.SaveChangesAsync();

        // Reload with includes
        var created = await _db.SeatMatrices
            .Include(s => s.Program)
            .Include(s => s.AcademicYear)
            .Include(s => s.SeatCounters)
            .FirstAsync(s => s.Id == sm.Id);

        return CreatedAtAction(nameof(Get), new { id = sm.Id }, MapToDto(created));
    }

    [HttpGet("{id}/counters")]
    public async Task<ActionResult<List<SeatCounterDto>>> GetCounters(int id)
    {
        var counters = await _db.SeatCounters
            .Where(c => c.SeatMatrixId == id)
            .ToListAsync();

        return counters.Select(c =>
            new SeatCounterDto(c.Id, c.QuotaType, c.TotalSeats, c.AllocatedSeats, c.TotalSeats - c.AllocatedSeats))
            .ToList();
    }

    private static SeatMatrixDto MapToDto(SeatMatrix s) => new(
        s.Id, s.ProgramId, s.Program?.Name ?? "", s.Program?.Code ?? "",
        s.AcademicYearId, s.AcademicYear?.Name ?? "",
        s.AdmissionMode, s.TotalIntake,
        s.KcetSeats, s.CometkSeats, s.ManagementSeats, s.SnSeats, s.JnkLimit,
        s.IsActive,
        s.SeatCounters.Select(c => new SeatCounterDto(
            c.Id, c.QuotaType, c.TotalSeats, c.AllocatedSeats, c.TotalSeats - c.AllocatedSeats)).ToList()
    );
}
