using Microsoft.EntityFrameworkCore;
using AdmissionCRM.API.Models;

namespace AdmissionCRM.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Institution> Institutions => Set<Institution>();
    public DbSet<Campus> Campuses => Set<Campus>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Models.Program> Programs => Set<Models.Program>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<SeatMatrix> SeatMatrices => Set<SeatMatrix>();
    public DbSet<SeatCounter> SeatCounters => Set<SeatCounter>();
    public DbSet<Applicant> Applicants => Set<Applicant>();
    public DbSet<DocumentType> DocumentTypes => Set<DocumentType>();
    public DbSet<ApplicantDocument> ApplicantDocuments => Set<ApplicantDocument>();
    public DbSet<Admission> Admissions => Set<Admission>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AdmissionNumberSequence> AdmissionNumberSequences => Set<AdmissionNumberSequence>();
    public DbSet<JnkCounter> JnkCounters => Set<JnkCounter>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<SeatCounter>()
            .Ignore(x => x.AvailableSeats);  // computed in DB, ignore here

        mb.Entity<SeatMatrix>()
            .HasIndex(s => new { s.ProgramId, s.AcademicYearId, s.AdmissionMode })
            .IsUnique();

        mb.Entity<SeatCounter>()
            .HasIndex(s => new { s.SeatMatrixId, s.QuotaType })
            .IsUnique();

        mb.Entity<AdmissionNumberSequence>()
            .HasIndex(s => new { s.SeatMatrixId, s.QuotaType })
            .IsUnique();

        mb.Entity<Admission>()
            .HasIndex(a => a.ApplicantId)
            .IsUnique();

        // Seed document types
        mb.Entity<DocumentType>().HasData(
            new DocumentType { Id = 1, Name = "10th Marksheet", IsRequired = true },
            new DocumentType { Id = 2, Name = "12th Marksheet", IsRequired = true },
            new DocumentType { Id = 3, Name = "KCET Score Card", IsRequired = false },
            new DocumentType { Id = 4, Name = "COMEDK Score Card", IsRequired = false },
            new DocumentType { Id = 5, Name = "Category Certificate", IsRequired = false },
            new DocumentType { Id = 6, Name = "Transfer Certificate", IsRequired = true },
            new DocumentType { Id = 7, Name = "Conduct Certificate", IsRequired = true },
            new DocumentType { Id = 8, Name = "Aadhar Card", IsRequired = true },
            new DocumentType { Id = 9, Name = "Passport Photo", IsRequired = true }
        );
    }
}
