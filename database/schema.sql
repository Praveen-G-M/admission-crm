-- ============================================================
-- Admission Management CRM - SQL Server Schema
-- ============================================================

CREATE DATABASE AdmissionCRM;
GO
USE AdmissionCRM;
GO

-- ============================================================
-- MASTER TABLES
-- ============================================================

CREATE TABLE Institutions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Code NVARCHAR(20) NOT NULL UNIQUE,
    Address NVARCHAR(500),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE Campuses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    InstitutionId INT NOT NULL FOREIGN KEY REFERENCES Institutions(Id),
    Name NVARCHAR(200) NOT NULL,
    Code NVARCHAR(20) NOT NULL,
    Location NVARCHAR(200),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE Departments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CampusId INT NOT NULL FOREIGN KEY REFERENCES Campuses(Id),
    Name NVARCHAR(200) NOT NULL,
    Code NVARCHAR(20) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE Programs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentId INT NOT NULL FOREIGN KEY REFERENCES Departments(Id),
    Name NVARCHAR(200) NOT NULL,
    Code NVARCHAR(20) NOT NULL,
    CourseType NVARCHAR(10) NOT NULL CHECK (CourseType IN ('UG','PG')),
    EntryType NVARCHAR(10) NOT NULL CHECK (EntryType IN ('Regular','Lateral')),
    DurationYears INT NOT NULL DEFAULT 4,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE AcademicYears (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    InstitutionId INT NOT NULL FOREIGN KEY REFERENCES Institutions(Id),
    Name NVARCHAR(20) NOT NULL,  -- e.g., "2025-26"
    StartYear INT NOT NULL,
    EndYear INT NOT NULL,
    IsActive BIT DEFAULT 1,
    IsCurrent BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================
-- SEAT MATRIX
-- ============================================================

CREATE TABLE SeatMatrices (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProgramId INT NOT NULL FOREIGN KEY REFERENCES Programs(Id),
    AcademicYearId INT NOT NULL FOREIGN KEY REFERENCES AcademicYears(Id),
    AdmissionMode NVARCHAR(20) NOT NULL CHECK (AdmissionMode IN ('Government','Management')),
    TotalIntake INT NOT NULL,
    -- Quota breakdowns
    KcetSeats INT NOT NULL DEFAULT 0,
    CometkSeats INT NOT NULL DEFAULT 0,
    ManagementSeats INT NOT NULL DEFAULT 0,
    SnSeats INT NOT NULL DEFAULT 0,  -- Supernumerary
    -- JnK special cap
    JnkLimit INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_SeatMatrix UNIQUE (ProgramId, AcademicYearId, AdmissionMode),
    CONSTRAINT CHK_QuotaTotal CHECK (KcetSeats + CometkSeats + ManagementSeats = TotalIntake)
);

-- Real-time seat counters
CREATE TABLE SeatCounters (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SeatMatrixId INT NOT NULL FOREIGN KEY REFERENCES SeatMatrices(Id),
    QuotaType NVARCHAR(20) NOT NULL CHECK (QuotaType IN ('KCET','COMEDK','Management','Supernumerary')),
    TotalSeats INT NOT NULL,
    AllocatedSeats INT NOT NULL DEFAULT 0,
    AvailableSeats AS (TotalSeats - AllocatedSeats) PERSISTED,
    CONSTRAINT UQ_SeatCounter UNIQUE (SeatMatrixId, QuotaType)
);

-- JnK institution-level counter
CREATE TABLE JnkCounters (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    InstitutionId INT NOT NULL FOREIGN KEY REFERENCES Institutions(Id),
    AcademicYearId INT NOT NULL FOREIGN KEY REFERENCES AcademicYears(Id),
    TotalLimit INT NOT NULL DEFAULT 0,
    AllocatedCount INT NOT NULL DEFAULT 0,
    CONSTRAINT UQ_JnkCounter UNIQUE (InstitutionId, AcademicYearId)
);

-- ============================================================
-- APPLICANTS
-- ============================================================

CREATE TABLE Applicants (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ApplicationNumber NVARCHAR(30) NOT NULL UNIQUE,
    -- Personal Info
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender NVARCHAR(10) NOT NULL CHECK (Gender IN ('Male','Female','Other')),
    Email NVARCHAR(150) NOT NULL,
    Phone NVARCHAR(15) NOT NULL,
    -- Academic Info
    Category NVARCHAR(10) NOT NULL CHECK (Category IN ('GM','SC','ST','OBC','EWS','Other')),
    EntryType NVARCHAR(10) NOT NULL CHECK (EntryType IN ('Regular','Lateral')),
    QuotaType NVARCHAR(20) NOT NULL CHECK (QuotaType IN ('KCET','COMEDK','Management','Supernumerary')),
    QualifyingExam NVARCHAR(100),
    QualifyingMarks DECIMAL(6,2),
    AllotmentNumber NVARCHAR(50),  -- for govt quota
    -- Program Selection
    ProgramId INT NOT NULL FOREIGN KEY REFERENCES Programs(Id),
    AcademicYearId INT NOT NULL FOREIGN KEY REFERENCES AcademicYears(Id),
    SeatMatrixId INT FOREIGN KEY REFERENCES SeatMatrices(Id),
    -- Status
    Status NVARCHAR(30) NOT NULL DEFAULT 'Applied' 
        CHECK (Status IN ('Applied','DocumentPending','DocumentVerified','SeatAllocated','Confirmed','Rejected')),
    IsJnkCandidate BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================
-- DOCUMENT TRACKING
-- ============================================================

CREATE TABLE DocumentTypes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    IsRequired BIT DEFAULT 1,
    IsActive BIT DEFAULT 1
);

CREATE TABLE ApplicantDocuments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ApplicantId INT NOT NULL FOREIGN KEY REFERENCES Applicants(Id),
    DocumentTypeId INT NOT NULL FOREIGN KEY REFERENCES DocumentTypes(Id),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending' 
        CHECK (Status IN ('Pending','Submitted','Verified','Rejected')),
    Remarks NVARCHAR(500),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_ApplicantDoc UNIQUE (ApplicantId, DocumentTypeId)
);

-- ============================================================
-- ADMISSIONS
-- ============================================================

CREATE TABLE Admissions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ApplicantId INT NOT NULL FOREIGN KEY REFERENCES Applicants(Id) UNIQUE,
    SeatCounterId INT NOT NULL FOREIGN KEY REFERENCES SeatCounters(Id),
    AdmissionNumber NVARCHAR(60) NOT NULL UNIQUE,
    -- Format: INST/2026/UG/CSE/KCET/0001
    AdmissionDate DATETIME2 DEFAULT GETUTCDATE(),
    FeeStatus NVARCHAR(10) NOT NULL DEFAULT 'Pending' 
        CHECK (FeeStatus IN ('Pending','Paid')),
    IsConfirmed BIT DEFAULT 0,
    ConfirmedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================
-- USER MANAGEMENT
-- ============================================================

CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(150) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Admin','AdmissionOfficer','Management')),
    InstitutionId INT FOREIGN KEY REFERENCES Institutions(Id),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================
-- SEQUENCES FOR ADMISSION NUMBERS
-- ============================================================

CREATE TABLE AdmissionNumberSequences (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SeatMatrixId INT NOT NULL FOREIGN KEY REFERENCES SeatMatrices(Id),
    QuotaType NVARCHAR(20) NOT NULL,
    LastNumber INT NOT NULL DEFAULT 0,
    CONSTRAINT UQ_AdmSeq UNIQUE (SeatMatrixId, QuotaType)
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO DocumentTypes (Name, IsRequired) VALUES
('10th Marksheet', 1),
('12th Marksheet', 1),
('KCET Score Card', 0),
('COMEDK Score Card', 0),
('Category Certificate', 0),
('Transfer Certificate', 1),
('Conduct Certificate', 1),
('Aadhar Card', 1),
('Passport Photo', 1);

-- Default Admin User (password: Admin@123)
INSERT INTO Users (Username, PasswordHash, FullName, Email, Role)
VALUES (
    'admin',
    '$2a$11$rBV2JDeWW3.vKyeCtNNz6.QrMJ3zHGMGKLqRvT5GN.jbHzD8qxLRS', -- Admin@123
    'System Administrator',
    'admin@college.edu',
    'Admin'
);

INSERT INTO Users (Username, PasswordHash, FullName, Email, Role)
VALUES (
    'officer1',
    '$2a$11$rBV2JDeWW3.vKyeCtNNz6.QrMJ3zHGMGKLqRvT5GN.jbHzD8qxLRS',
    'Admission Officer',
    'officer@college.edu',
    'AdmissionOfficer'
);

INSERT INTO Users (Username, PasswordHash, FullName, Email, Role)
VALUES (
    'mgmt1',
    '$2a$11$rBV2JDeWW3.vKyeCtNNz6.QrMJ3zHGMGKLqRvT5GN.jbHzD8qxLRS',
    'Management User',
    'mgmt@college.edu',
    'Management'
);

GO

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- Allocate a seat atomically
CREATE OR ALTER PROCEDURE sp_AllocateSeat
    @ApplicantId INT,
    @SeatCounterId INT,
    @Result NVARCHAR(50) OUTPUT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @Available INT;

        SELECT @Available = AvailableSeats
        FROM SeatCounters WITH (UPDLOCK, ROWLOCK)
        WHERE Id = @SeatCounterId;

        IF @Available <= 0
        BEGIN
            SET @Result = 'QUOTA_FULL';
            ROLLBACK;
            RETURN;
        END

        UPDATE SeatCounters
        SET AllocatedSeats = AllocatedSeats + 1
        WHERE Id = @SeatCounterId;

        UPDATE Applicants
        SET Status = 'SeatAllocated', UpdatedAt = GETUTCDATE()
        WHERE Id = @ApplicantId;

        SET @Result = 'SUCCESS';
        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SET @Result = 'ERROR';
        THROW;
    END CATCH
END;
GO

-- Generate admission number
CREATE OR ALTER PROCEDURE sp_GenerateAdmissionNumber
    @ApplicantId INT,
    @SeatCounterId INT,
    @AdmissionNumber NVARCHAR(100) OUTPUT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @SeqNum INT, @InstCode NVARCHAR(20), @Year INT,
                @CourseType NVARCHAR(10), @ProgCode NVARCHAR(20),
                @QuotaType NVARCHAR(20), @SeatMatrixId INT, @AcYearId INT;

        -- Get seat matrix info
        SELECT @SeatMatrixId = sc.SeatMatrixId, @QuotaType = sc.QuotaType
        FROM SeatCounters sc WHERE sc.Id = @SeatCounterId;

        SELECT @AcYearId = sm.AcademicYearId
        FROM SeatMatrices sm WHERE sm.Id = @SeatMatrixId;

        SELECT 
            @InstCode = i.Code,
            @Year = ay.EndYear,
            @CourseType = p.CourseType,
            @ProgCode = p.Code
        FROM Applicants a
        JOIN Programs p ON a.ProgramId = p.Id
        JOIN Departments d ON p.DepartmentId = d.Id
        JOIN Campuses c ON d.CampusId = c.Id
        JOIN Institutions i ON c.InstitutionId = i.Id
        JOIN AcademicYears ay ON ay.Id = @AcYearId
        WHERE a.Id = @ApplicantId;

        -- Get/increment sequence
        MERGE AdmissionNumberSequences AS target
        USING (SELECT @SeatMatrixId, @QuotaType) AS source(SeatMatrixId, QuotaType)
        ON target.SeatMatrixId = source.SeatMatrixId AND target.QuotaType = source.QuotaType
        WHEN MATCHED THEN UPDATE SET LastNumber = LastNumber + 1
        WHEN NOT MATCHED THEN INSERT (SeatMatrixId, QuotaType, LastNumber) VALUES (@SeatMatrixId, @QuotaType, 1);

        SELECT @SeqNum = LastNumber
        FROM AdmissionNumberSequences
        WHERE SeatMatrixId = @SeatMatrixId AND QuotaType = @QuotaType;

        SET @AdmissionNumber = @InstCode + '/' + CAST(@Year AS NVARCHAR) + '/' + 
                               @CourseType + '/' + @ProgCode + '/' + @QuotaType + '/' + 
                               RIGHT('0000' + CAST(@SeqNum AS NVARCHAR), 4);

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO
