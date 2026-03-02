using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdmissionCRM.API.Data;
using AdmissionCRM.API.Models;
using AdmissionCRM.API.Models.DTOs;

namespace AdmissionCRM.API.Controllers;

// ─── Institutions ────────────────────────────────────────────
[ApiController, Route("api/[controller]"), Authorize]
public class InstitutionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public InstitutionsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<InstitutionDto>>> GetAll() =>
        await _db.Institutions.Where(i => i.IsActive)
            .Select(i => new InstitutionDto(i.Id, i.Name, i.Code, i.Address, i.Phone, i.Email, i.IsActive))
            .ToListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<InstitutionDto>> Get(int id)
    {
        var i = await _db.Institutions.FindAsync(id);
        if (i == null) return NotFound();
        return new InstitutionDto(i.Id, i.Name, i.Code, i.Address, i.Phone, i.Email, i.IsActive);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<InstitutionDto>> Create(CreateInstitutionDto dto)
    {
        var inst = new Institution { Name = dto.Name, Code = dto.Code.ToUpper(), Address = dto.Address, Phone = dto.Phone, Email = dto.Email };
        _db.Institutions.Add(inst);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = inst.Id },
            new InstitutionDto(inst.Id, inst.Name, inst.Code, inst.Address, inst.Phone, inst.Email, inst.IsActive));
    }

    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateInstitutionDto dto)
    {
        var inst = await _db.Institutions.FindAsync(id);
        if (inst == null) return NotFound();
        inst.Name = dto.Name; inst.Code = dto.Code.ToUpper();
        inst.Address = dto.Address; inst.Phone = dto.Phone; inst.Email = dto.Email;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var inst = await _db.Institutions.FindAsync(id);
        if (inst == null) return NotFound();
        inst.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── Campuses ────────────────────────────────────────────────
[ApiController, Route("api/[controller]"), Authorize]
public class CampusesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CampusesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CampusDto>>> GetAll([FromQuery] int? institutionId)
    {
        var q = _db.Campuses.Include(c => c.Institution).Where(c => c.IsActive);
        if (institutionId.HasValue) q = q.Where(c => c.InstitutionId == institutionId);
        return await q.Select(c => new CampusDto(c.Id, c.InstitutionId, c.Institution.Name, c.Name, c.Code, c.Location, c.IsActive)).ToListAsync();
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<CampusDto>> Create(CreateCampusDto dto)
    {
        var campus = new Campus { InstitutionId = dto.InstitutionId, Name = dto.Name, Code = dto.Code.ToUpper(), Location = dto.Location };
        _db.Campuses.Add(campus);
        await _db.SaveChangesAsync();
        var inst = await _db.Institutions.FindAsync(campus.InstitutionId);
        return Ok(new CampusDto(campus.Id, campus.InstitutionId, inst!.Name, campus.Name, campus.Code, campus.Location, campus.IsActive));
    }

    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateCampusDto dto)
    {
        var campus = await _db.Campuses.FindAsync(id);
        if (campus == null) return NotFound();
        campus.Name = dto.Name; campus.Code = dto.Code.ToUpper(); campus.Location = dto.Location;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── Departments ─────────────────────────────────────────────
[ApiController, Route("api/[controller]"), Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public DepartmentsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetAll([FromQuery] int? campusId)
    {
        var q = _db.Departments.Include(d => d.Campus).Where(d => d.IsActive);
        if (campusId.HasValue) q = q.Where(d => d.CampusId == campusId);
        return await q.Select(d => new DepartmentDto(d.Id, d.CampusId, d.Campus.Name, d.Name, d.Code, d.IsActive)).ToListAsync();
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentDto>> Create(CreateDepartmentDto dto)
    {
        var dept = new Department { CampusId = dto.CampusId, Name = dto.Name, Code = dto.Code.ToUpper() };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();
        var campus = await _db.Campuses.FindAsync(dept.CampusId);
        return Ok(new DepartmentDto(dept.Id, dept.CampusId, campus!.Name, dept.Name, dept.Code, dept.IsActive));
    }

    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateDepartmentDto dto)
    {
        var dept = await _db.Departments.FindAsync(id);
        if (dept == null) return NotFound();
        dept.Name = dto.Name; dept.Code = dto.Code.ToUpper();
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── Programs ─────────────────────────────────────────────────
[ApiController, Route("api/[controller]"), Authorize]
public class ProgramsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProgramsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ProgramDto>>> GetAll([FromQuery] int? departmentId)
    {
        var q = _db.Programs.Include(p => p.Department).Where(p => p.IsActive);
        if (departmentId.HasValue) q = q.Where(p => p.DepartmentId == departmentId);
        return await q.Select(p => new ProgramDto(p.Id, p.DepartmentId, p.Department.Name, p.Name, p.Code, p.CourseType, p.EntryType, p.DurationYears, p.IsActive)).ToListAsync();
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProgramDto>> Create(CreateProgramDto dto)
    {
        var prog = new Models.Program
        {
            DepartmentId = dto.DepartmentId, Name = dto.Name, Code = dto.Code.ToUpper(),
            CourseType = dto.CourseType, EntryType = dto.EntryType, DurationYears = dto.DurationYears
        };
        _db.Programs.Add(prog);
        await _db.SaveChangesAsync();
        var dept = await _db.Departments.FindAsync(prog.DepartmentId);
        return Ok(new ProgramDto(prog.Id, prog.DepartmentId, dept!.Name, prog.Name, prog.Code, prog.CourseType, prog.EntryType, prog.DurationYears, prog.IsActive));
    }

    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateProgramDto dto)
    {
        var prog = await _db.Programs.FindAsync(id);
        if (prog == null) return NotFound();
        prog.Name = dto.Name; prog.Code = dto.Code.ToUpper();
        prog.CourseType = dto.CourseType; prog.EntryType = dto.EntryType; prog.DurationYears = dto.DurationYears;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── Academic Years ───────────────────────────────────────────
[ApiController, Route("api/[controller]"), Authorize]
public class AcademicYearsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AcademicYearsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<AcademicYearDto>>> GetAll([FromQuery] int? institutionId)
    {
        var q = _db.AcademicYears.Where(a => a.IsActive);
        if (institutionId.HasValue) q = q.Where(a => a.InstitutionId == institutionId);
        return await q.Select(a => new AcademicYearDto(a.Id, a.InstitutionId, a.Name, a.StartYear, a.EndYear, a.IsCurrent, a.IsActive)).ToListAsync();
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<AcademicYearDto>> Create(CreateAcademicYearDto dto)
    {
        if (dto.IsCurrent)
            await _db.AcademicYears.Where(a => a.InstitutionId == dto.InstitutionId && a.IsCurrent)
                .ForEachAsync(a => a.IsCurrent = false);

        var ay = new AcademicYear
        {
            InstitutionId = dto.InstitutionId, Name = dto.Name,
            StartYear = dto.StartYear, EndYear = dto.EndYear, IsCurrent = dto.IsCurrent
        };
        _db.AcademicYears.Add(ay);
        await _db.SaveChangesAsync();
        return Ok(new AcademicYearDto(ay.Id, ay.InstitutionId, ay.Name, ay.StartYear, ay.EndYear, ay.IsCurrent, ay.IsActive));
    }
}

// ─── Document Types ───────────────────────────────────────────
[ApiController, Route("api/[controller]"), Authorize]
public class DocumentTypesController : ControllerBase
{
    private readonly AppDbContext _db;
    public DocumentTypesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<DocumentType>>> GetAll() =>
        await _db.DocumentTypes.Where(d => d.IsActive).ToListAsync();
}
