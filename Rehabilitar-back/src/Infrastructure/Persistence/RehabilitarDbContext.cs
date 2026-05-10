using Domain;
using Domain.Clientes;
using Domain.Profesores;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class RehabilitarDbContext : IdentityDbContext<User, Role, Guid>
{
    public DbSet<Reserva> Reservas { get; set; }
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Profesor> Profesores { get; set; }
    public DbSet<Sala> Salas { get; set; }

    public RehabilitarDbContext(DbContextOptions<RehabilitarDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<User>().ToTable("Users");
        builder.Entity<Role>().ToTable("Roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
        builder.Entity<Sala>().ToTable("Salas");

        builder.Entity<Cliente>(entity =>
        {
            entity.ToTable("Clientes");
            entity.HasKey(c => c.UserId);
            entity.OwnsOne(c => c.Dni, dni =>
            {
                dni.Property(d => d.Valor).HasColumnName("Dni");
            });
        });

        builder.Entity<Profesor>(entity =>
        {
            entity.ToTable("Profesores");
            entity.HasKey(p => p.UserId);
            entity.Ignore(p => p.ActividadesAsignadas);
        });
    }
}