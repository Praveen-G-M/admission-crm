using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdmissionCRM.API.Data;
using AdmissionCRM.API.Models;
using AdmissionCRM.API.Models.DTOs;

namespace AdmissionCRM.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class ApplicantsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ApplicantsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ApplicantDto>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] int? programId,
        [FromQuery] int? academicYearId,
        [FromQuery] string? search)
    {
        var q = _db.Applicants
            .Include(a => a.Program)
            .Include(a => a.AcademicYear)
            .Include(a => a.Documents).ThenInclude(d => d.DocumentType)
            .Include(a => a.Admission)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status)) q = q.Where(a => a.Status == status);
        if (programId.HasValue) q = q.Where(a => a.ProgramId == programId);
        if (academicYearId.HasValue) q = q.Where(a => a.AcademicYearId == academicYearId);
        if (!string.IsNullOrEmpty(search))
            q = q.Where(a => a.FirstName.Contains(search) || a.LastName.Contains(search)
                           || a.Email.Contains(search) || a.ApplicationNumber.Contains(search));

        return await q.Select(a => MapToDto(a)).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApplicantDto>> Get(int id)
    {
        var a = await _db.Applicants
            .Include(a => a.Program)
            .Include(a => a.AcademicYear)
            .Include(a => a.Documents).ThenInclude(d => d.DocumentType)
            .Include(a => a.Admission)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (a == null) return NotFound();
        return MapToDto(a);
    }

    [HttpPost, Authorize(Roles = "Admin,AdmissionOfficer")]
    public async Task<ActionResult<ApplicantDto>> Create(CreateApplicantDto dto)
    {
        // Generate application number
        var count = await _db.Applicants.CountAsync() + 1;
        var year = DateTime.UtcNow.Year;
        var appNum = $"APP/{year}/{count:D5}";

        var applicant = new Applicant
        {
            ApplicationNumber = appNum,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            DateOfBirth = dto.DateOfBirth,
            Gender = dto.Gender,
            Email = dto.Email,
            Phone = dto.Phone,
            Category = dto.Category,
            EntryType = dto.EntryType,
            QuotaType = dto.QuotaType,
            QualifyingExam = dto.QualifyingExam,
            QualifyingMarks = dto.QualifyingMarks,
            AllotmentNumber = dto.AllotmentNumber,
            ProgramId = dto.ProgramId,
            AcademicYearId = dto.AcademicYearId,
            IsJnkCandidate = dto.IsJnkCandidate,
            Status = "Applied"
        };

        _db.Applicants.Add(applicant);
        await _db.SaveChangesAsync();

        // Auto-create document checklist for required docs
        var docTypes = await _db.DocumentTypes.Where(d => d.IsActive).ToListAsync();
        var docs = docTypes.Select(dt => new ApplicantDocument
        {
            ApplicantId = applicant.Id,
            DocumentTypeId = dt.Id,
            Status = "Pending"
        });
        _db.ApplicantDocuments.AddRange(docs);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = applicant.Id },
            await Get(applicant.Id).ContinueWith(t => t.Result.Value));
    }

    [HttpPut("{id}"), Authorize(Roles = "Admin,AdmissionOfficer")]
    public async Task<IActionResult> Update(int id, CreateApplicantDto dto)
    {
        var a = await _db.Applicants.FindAsync(id);
        if (a == null) return NotFound();

        a.FirstName = dto.FirstName; a.LastName = dto.LastName;
        a.DateOfBirth = dto.DateOfBirth; a.Gender = dto.Gender;
        a.Email = dto.Email; a.Phone = dto.Phone;
        a.Category = dto.Category; a.EntryType = dto.EntryType;
        a.QuotaType = dto.QuotaType;
        a.QualifyingExam = dto.QualifyingExam; a.QualifyingMarks = dto.QualifyingMarks;
        a.AllotmentNumber = dto.AllotmentNumber;
        a.IsJnkCandidate = dto.IsJnkCandidate;
        a.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/documents"), Authorize(Roles = "Admin,AdmissionOfficer")]
    public async Task<IActionResult> UpdateDocument(int id, UpdateDocumentStatusDto dto)
    {
        var doc = await _db.ApplicantDocuments
            .FirstOrDefaultAsync(d => d.ApplicantId == id && d.DocumentTypeId == dto.DocumentTypeId);

        if (doc == null) return NotFound();

        doc.Status = dto.Status;
        doc.Remarks = dto.Remarks;
        doc.UpdatedAt = DateTime.UtcNow;

        // Update applicant status
        var applicant = await _db.Applicants.FindAsync(id);
        if (applicant != null && applicant.Status == "Applied")
        {
            applicant.Status = "DocumentPending";
            applicant.UpdatedAt = DateTime.UtcNow;
        }

        // Check if all required docs verified
        var allDocs = await _db.ApplicantDocuments
            .Include(d => d.DocumentType)
            .Where(d => d.ApplicantId == id && d.DocumentType.IsRequired)
            .ToListAsync();

        if (allDocs.All(d => d.Status == "Verified") && applicant != null)
        {
            applicant.Status = "DocumentVerified";
            applicant.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ApplicantDto MapToDto(Applicant a) => new(
        a.Id, a.ApplicationNumber, a.FirstName, a.LastName,
        a.DateOfBirth, a.Gender, a.Email, a.Phone,
        a.Category, a.EntryType, a.QuotaType,
        a.QualifyingExam, a.QualifyingMarks, a.AllotmentNumber,
        a.ProgramId, a.Program?.Name ?? "",
        a.AcademicYearId, a.AcademicYear?.Name ?? "",
        a.Status, a.IsJnkCandidate, a.CreatedAt,
        a.Documents.Select(d => new DocumentStatusDto(
            d.Id, d.DocumentTypeId, d.DocumentType?.Name ?? "", d.Status, d.Remarks)).ToList(),
        a.Admission == null ? null : new AdmissionDto(
            a.Admission.Id, a.Admission.AdmissionNumber,
            a.Admission.FeeStatus, a.Admission.IsConfirmed, a.Admission.ConfirmedAt)
    );
}
