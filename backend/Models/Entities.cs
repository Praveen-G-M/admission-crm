using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AdmissionCRM.API.Models;

public class Institution
{
    public int Id { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Required, MaxLength(20)] public string Code { get; set; } = "";
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Campus> Campuses { get; set; } = new List<Campus>();
    public ICollection<AcademicYear> AcademicYears { get; set; } = new List<AcademicYear>();
}

public class Campus
{
    public int Id { get; set; }
    public int InstitutionId { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Required, MaxLength(20)] public string Code { get; set; } = "";
    public string? Location { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Institution Institution { get; set; } = null!;
    public ICollection<Department> Departments { get; set; } = new List<Department>();
}

public class Department
{
    public int Id { get; set; }
    public int CampusId { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Required, MaxLength(20)] public string Code { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Campus Campus { get; set; } = null!;
    public ICollection<Program> Programs { get; set; } = new List<Program>();
}

public class Program
{
    public int Id { get; set; }
    public int DepartmentId { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Required, MaxLength(20)] public string Code { get; set; } = "";
    [Required] public string CourseType { get; set; } = "UG"; // UG/PG
    [Required] public string EntryType { get; set; } = "Regular"; // Regular/Lateral
    public int DurationYears { get; set; } = 4;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Department Department { get; set; } = null!;
    public ICollection<SeatMatrix> SeatMatrices { get; set; } = new List<SeatMatrix>();
}

public class AcademicYear
{
    public int Id { get; set; }
    public int InstitutionId { get; set; }
    [Required, MaxLength(20)] public string Name { get; set; } = ""; // "2025-26"
    public int StartYear { get; set; }
    public int EndYear { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsCurrent { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Institution Institution { get; set; } = null!;
}

public class SeatMatrix
{
    public int Id { get; set; }
    public int ProgramId { get; set; }
    public int AcademicYearId { get; set; }
    [Required] public string AdmissionMode { get; set; } = "Government"; // Government/Management
    public int TotalIntake { get; set; }
    public int KcetSeats { get; set; }
    public int CometkSeats { get; set; }
    public int ManagementSeats { get; set; }
    public int SnSeats { get; set; } // Supernumerary
    public int JnkLimit { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Program Program { get; set; } = null!;
    public AcademicYear AcademicYear { get; set; } = null!;
    public ICollection<SeatCounter> SeatCounters { get; set; } = new List<SeatCounter>();
}

public class SeatCounter
{
    public int Id { get; set; }
    public int SeatMatrixId { get; set; }
    [Required] public string QuotaType { get; set; } = ""; // KCET/COMEDK/Management/Supernumerary
    public int TotalSeats { get; set; }
    public int AllocatedSeats { get; set; } = 0;

    [NotMapped]
    public int AvailableSeats => TotalSeats - AllocatedSeats;

    public SeatMatrix SeatMatrix { get; set; } = null!;
}

public class Applicant
{
    public int Id { get; set; }
    [Required, MaxLength(30)] public string ApplicationNumber { get; set; } = "";
    [Required, MaxLength(100)] public string FirstName { get; set; } = "";
    [Required, MaxLength(100)] public string LastName { get; set; } = "";
    public DateTime DateOfBirth { get; set; }
    [Required] public string Gender { get; set; } = "";
    [Required, MaxLength(150)] public string Email { get; set; } = "";
    [Required, MaxLength(15)] public string Phone { get; set; } = "";
    [Required] public string Category { get; set; } = "GM";
    [Required] public string EntryType { get; set; } = "Regular";
    [Required] public string QuotaType { get; set; } = "Management";
    public string? QualifyingExam { get; set; }
    public decimal? QualifyingMarks { get; set; }
    public string? AllotmentNumber { get; set; }
    public int ProgramId { get; set; }
    public int AcademicYearId { get; set; }
    public int? SeatMatrixId { get; set; }
    public string Status { get; set; } = "Applied";
    public bool IsJnkCandidate { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Program Program { get; set; } = null!;
    public AcademicYear AcademicYear { get; set; } = null!;
    public SeatMatrix? SeatMatrix { get; set; }
    public ICollection<ApplicantDocument> Documents { get; set; } = new List<ApplicantDocument>();
    public Admission? Admission { get; set; }
}

public class DocumentType
{
    public int Id { get; set; }
    [Required, MaxLength(100)] public string Name { get; set; } = "";
    public bool IsRequired { get; set; } = true;
    public bool IsActive { get; set; } = true;
}

public class ApplicantDocument
{
    public int Id { get; set; }
    public int ApplicantId { get; set; }
    public int DocumentTypeId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending/Submitted/Verified/Rejected
    public string? Remarks { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Applicant Applicant { get; set; } = null!;
    public DocumentType DocumentType { get; set; } = null!;
}

public class Admission
{
    public int Id { get; set; }
    public int ApplicantId { get; set; }
    public int SeatCounterId { get; set; }
    [Required, MaxLength(100)] public string AdmissionNumber { get; set; } = "";
    public DateTime AdmissionDate { get; set; } = DateTime.UtcNow;
    public string FeeStatus { get; set; } = "Pending";
    public bool IsConfirmed { get; set; } = false;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Applicant Applicant { get; set; } = null!;
    public SeatCounter SeatCounter { get; set; } = null!;
}

public class User
{
    public int Id { get; set; }
    [Required, MaxLength(50)] public string Username { get; set; } = "";
    [Required] public string PasswordHash { get; set; } = "";
    [Required, MaxLength(150)] public string FullName { get; set; } = "";
    [Required, MaxLength(150)] public string Email { get; set; } = "";
    [Required] public string Role { get; set; } = "AdmissionOfficer";
    public int? InstitutionId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AdmissionNumberSequence
{
    public int Id { get; set; }
    public int SeatMatrixId { get; set; }
    [Required] public string QuotaType { get; set; } = "";
    public int LastNumber { get; set; } = 0;
}

public class JnkCounter
{
    public int Id { get; set; }
    public int InstitutionId { get; set; }
    public int AcademicYearId { get; set; }
    public int TotalLimit { get; set; }
    public int AllocatedCount { get; set; } = 0;
}
