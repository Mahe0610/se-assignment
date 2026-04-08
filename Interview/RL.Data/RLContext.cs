using Microsoft.EntityFrameworkCore;
using RL.Data.DataModels;
using RL.Data.DataModels.Common;

namespace RL.Data;

public class RLContext : DbContext
{
    public DbSet<Plan> Plans { get; set; }
    public DbSet<PlanProcedure> PlanProcedures { get; set; }
    public DbSet<PlanProcedureUser> PlanProcedureUsers { get; set; }
    public DbSet<Procedure> Procedures { get; set; }
    public DbSet<User> Users { get; set; }

    public RLContext(DbContextOptions<RLContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<PlanProcedure>(entity =>
        {
            entity.HasKey(pp => new { pp.PlanId, pp.ProcedureId });
            entity.HasOne(pp => pp.Plan).WithMany(p => p.PlanProcedures);
            entity.HasOne(pp => pp.Procedure).WithMany();
        });

        builder.Entity<PlanProcedureUser>(entity =>
        {
            entity.HasKey(ppu => new { ppu.PlanId, ppu.ProcedureId, ppu.UserId });

            entity.HasOne(ppu => ppu.PlanProcedure)
                .WithMany(pp => pp.AssignedUsers)
                .HasForeignKey(ppu => new { ppu.PlanId, ppu.ProcedureId });

            entity.HasOne(ppu => ppu.User)
                .WithMany(u => u.AssignedPlanProcedures)
                .HasForeignKey(ppu => ppu.UserId);
        });

        builder.Entity<User>().HasData(
            new User { UserId = 1, Name = "Nick Morrison", CreateDate = DateTime.UtcNow, UpdateDate = DateTime.UtcNow },
            new User { UserId = 2, Name = "Scott Cassidy", CreateDate = DateTime.UtcNow, UpdateDate = DateTime.UtcNow },
            new User { UserId = 3, Name = "Tony Bidner", CreateDate = DateTime.UtcNow, UpdateDate = DateTime.UtcNow },
            new User { UserId = 4, Name = "Patryk Skwarko", CreateDate = DateTime.UtcNow, UpdateDate = DateTime.UtcNow }
        );
    }

    #region TimeStamps
    public override int SaveChanges()
    {
        AddTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        AddTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void AddTimestamps()
    {
        var entities = ChangeTracker.Entries().Where(x => x.Entity is IChangeTrackable && (x.State == EntityState.Added || x.State == EntityState.Modified));

        foreach (var entity in entities)
        {
            if (entity.State == EntityState.Added)
            {
                ((IChangeTrackable)entity.Entity).CreateDate = DateTime.UtcNow;
            }

            ((IChangeTrackable)entity.Entity).UpdateDate = DateTime.UtcNow;
        }
    }
    #endregion
}
