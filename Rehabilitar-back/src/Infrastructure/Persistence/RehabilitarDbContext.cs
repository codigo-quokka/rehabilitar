using Domain.Users;
using Domain.Salas;
using Domain.Reservas;
using Domain.Clientes;
using Domain.Profesores;
using Domain.Actividades;
using Domain.AptosFisicos;
using Domain.Pagos;
using Domain.Notificaciones;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Infrastructure.Persistence;

public class RehabilitarDbContext : IdentityDbContext<User, Role, Guid>
{
    public DbSet<Reserva> Reservas { get; set; }
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Profesor> Profesores { get; set; }
    public DbSet<Sala> Salas { get; set; }
    public DbSet<Actividad> Actividades { get; set; }
    public DbSet<AptoFisico> AptosFisicos { get; set; }
    public DbSet<IntencionPago> IntencionesPago { get; set; }
    public DbSet<Notificacion> Notificaciones { get; set; }

    public RehabilitarDbContext(DbContextOptions<RehabilitarDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(c => c.Dni)
                .HasConversion(
                    dniObjeto => dniObjeto.Valor,
                    dniString => new Dni(dniString)
                )
            .HasColumnName("Dni")
            .HasMaxLength(8)
            .IsRequired();

            entity.Property(u => u.NotificacionAplicacion)
                .HasDefaultValue(true);
        });
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

            // mapeo a user:
            entity.HasOne<User>(p => p.User)
                .WithOne()
                .HasForeignKey<Cliente>(c => c.UserId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);
            entity.OwnsOne(c => c.SaldoAFavor, s =>
            {
                s.Property(d => d.MontoTotal).HasColumnName("MontoTotal").HasColumnType("decimal(18, 2)");
            });
        });

        builder.Entity<Profesor>(entity =>
        {
            entity.ToTable("Profesores");
            entity.HasKey(p => p.UserId);

            // mapeo a user:
            entity.HasOne<User>(p => p.User)
                .WithOne()
                .HasForeignKey<Profesor>(p => p.UserId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);

            entity.Ignore(p => p.ActividadesAsignadas);
        });

        builder.Entity<Reserva>(entity =>
        {
            entity.ToTable("Reservas");
            entity.HasKey(r => r.Id);
            entity.HasOne(r => r.Cliente)
                  .WithMany()
                  .HasForeignKey(r => r.ClienteId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.OwnsOne(r => r.DetallePago, dp =>
            {
                dp.Property(d => d.MontoTotal).HasColumnName("MontoTotal").HasColumnType("decimal(18, 2)");
                dp.Property(d => d.MontoPagado).HasColumnName("MontoPagado").HasColumnType("decimal(18, 2)");
            });
        });

        builder.Entity<Actividad>(entity =>
        {
            entity.ToTable("Actividades");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Version)
                  .IsConcurrencyToken(); // Para manejar concurrencia optimista
            entity.HasOne(a => a.Sala)
                  .WithMany(s => s.Actividades)
                  .HasForeignKey(a => a.SalaId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Profesor)
                  .WithMany(p => p.ActividadesAsignadas)
                  .HasForeignKey(a => a.ProfesorId)
                  .OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(a => a.Reservas)
                  .WithOne(r => r.Actividad)
                  .HasForeignKey(r => r.ActividadId)
                  .OnDelete(DeleteBehavior.ClientCascade);
        });

        builder.Entity<Sala>(entity =>
        {
           entity.ToTable("Salas");
           entity.HasIndex(s => s.Nombre).IsUnique();
        });

        builder.Entity<AptoFisico>(entity =>
        {
            entity.ToTable("AptosFisicos");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Archivo).HasColumnType("BLOB");
            entity.Property(a => a.NombreArchivo).HasMaxLength(255).IsRequired();
            entity.Property(a => a.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(a => a.MotivoRechazo).HasMaxLength(500);
            entity.Property(a => a.Estado)
                  .HasConversion<string>()
                  .HasMaxLength(20)
                  .IsRequired();
            
            entity.HasOne(a => a.Cliente)
                  .WithMany()
                  .HasForeignKey(a => a.ClienteId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(a => a.Evaluador)
                  .WithMany()
                  .HasForeignKey(a => a.EvaluadoPor)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<IntencionPago>(entity =>
        {
            entity.ToTable("IntencionesPago");
            entity.HasKey(i => i.Id);
            entity.Property(i => i.ActividadesIds)
                  .HasConversion(
                      v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                      v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions)null)!
                  );
            entity.Property(i => i.MontoAPagar).HasColumnType("decimal(18, 2)");
        });

        builder.Entity<Notificacion>(entity =>
        {
            entity.ToTable("Notificaciones");
            entity.HasKey(n => n.Id);
            entity.HasOne<User>()
                  .WithMany()
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
