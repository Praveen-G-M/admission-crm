namespace AdmissionCRM.API.Models.DTOs;

// ─── Auth ───────────────────────────────────────────────────
public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Role, string FullName, int UserId);

// ─── Institution ─────────────────────────────────────────────
public record CreateInstitutionDto(string Name, string Code, string? Address, string? Phone, string? Email);
public record InstitutionDto(int Id, string Name, string Code, string? Address, string? Phone, string? Email, bool IsActive);

// ─── Campus ──────────────────────────────────────────────────
public record CreateCampusDto(int InstitutionId, string Name, string Code, string? Location);
public record CampusDto(int Id, int InstitutionId, string InstitutionName, string Name, string Code, string? Location, bool IsActive);

// ─── Department ──────────────────────────────────────────────
public record CreateDepartmentDto(int CampusId, string Name, string Code);
public record DepartmentDto(int Id, int CampusId, string CampusName, string Name, string Code, bool IsActive);

// ─── Program ─────────────────────────────────────────────────
public record CreateProgramDto(int DepartmentId, string Name, string Code, string CourseType, string EntryType, int DurationYears);
public record ProgramDto(int Id, int DepartmentId, string DepartmentName, string Name, string Code, string CourseType, string EntryType, int DurationYears, bool IsActive);

// ─── Academic Year ───────────────────────────────────────────
public record CreateAcademicYearDto(int InstitutionId, string Name, int StartYear, int EndYear, bool IsCurrent);
public record AcademicYearDto(int Id, int InstitutionId, string Name, int StartYear, int EndYear, bool IsCurrent, bool IsActive);

// ─── Seat Matrix ─────────────────────────────────────────────
public record CreateSeatMatrixDto(
    int ProgramId, int AcademicYearId, string AdmissionMode,
    int TotalIntake, int KcetSeats, int CometkSeats, int ManagementSeats,
    int SnSeats, int JnkLimit);

public record SeatMatrixDto(
    int Id, int ProgramId, string ProgramName, string ProgramCode,
    int AcademicYearId, string AcademicYearName, string AdmissionMode,
    int TotalIntake, int KcetSeats, int CometkSeats, int ManagementSeats, int SnSeats, int JnkLimit,
    bool IsActive, List<SeatCounterDto> Counters);

public record SeatCounterDto(int Id, string QuotaType, int TotalSeats, int AllocatedSeats, int AvailableSeats);

// ─── Applicant ───────────────────────────────────────────────
public record CreateApplicantDto(
    string FirstName, string LastName, DateTime DateOfBirth, string Gender,
    string Email, string Phone, string Category, string EntryType, string QuotaType,
    string? QualifyingExam, decimal? QualifyingMarks, string? AllotmentNumber,
    int ProgramId, int AcademicYearId, bool IsJnkCandidate);

public record ApplicantDto(
    int Id, string ApplicationNumber, string FirstName, string LastName,
    DateTime DateOfBirth, string Gender, string Email, string Phone,
    string Category, string EntryType, string QuotaType,
    string? QualifyingExam, decimal? QualifyingMarks, string? AllotmentNumber,
    int ProgramId, string ProgramName, int AcademicYearId, string AcademicYearName,
    string Status, bool IsJnkCandidate, DateTime CreatedAt,
    List<DocumentStatusDto> Documents, AdmissionDto? Admission);

public record DocumentStatusDto(int Id, int DocumentTypeId, string DocumentName, string Status, string? Remarks);
public record UpdateDocumentStatusDto(int DocumentTypeId, string Status, string? Remarks);

// ─── Allocation ───────────────────────────────────────────────
public record AllocateSeatDto(int ApplicantId, int SeatCounterId);
public record AllocationResultDto(bool Success, string Message, string? AdmissionNumber);

// ─── Admission ───────────────────────────────────────────────
public record AdmissionDto(int Id, string AdmissionNumber, string FeeStatus, bool IsConfirmed, DateTime? ConfirmedAt);
public record UpdateFeeStatusDto(string FeeStatus); // Pending/Paid
public record ConfirmAdmissionDto(int AdmissionId);

// ─── Dashboard ───────────────────────────────────────────────
public record DashboardDto(
    int TotalIntake, int TotalAdmitted, int TotalConfirmed,
    int PendingDocuments, int FeePending,
    List<QuotaSummaryDto> QuotaSummaries,
    List<ProgramSummaryDto> ProgramSummaries);

public record QuotaSummaryDto(string QuotaType, int Total, int Allocated, int Available);
public record ProgramSummaryDto(string ProgramName, string ProgramCode, int Intake, int Admitted);

// ─── User Management ─────────────────────────────────────────
public record CreateUserDto(string Username, string Password, string FullName, string Email, string Role, int? InstitutionId);
public record UserDto(int Id, string Username, string FullName, string Email, string Role, bool IsActive);
