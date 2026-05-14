using Microsoft.AspNetCore.Identity;
using Domain;
using Domain.Clientes;
using Domain.Profesores;
using Application.Seeding;
using Domain.Salas;
using Microsoft.EntityFrameworkCore;
using Domain.Actividades;
using Domain.Reservas;

namespace Infrastructure.Persistence.Seeding;

public class SeedingService : ISeedingService
{

    private readonly RoleManager<Role> _roleManager;
    private readonly UserManager<User> _userManager;
    private readonly RehabilitarDbContext _dbContext;

    public SeedingService(RoleManager<Role> roleManager,
                        UserManager<User> userManager,
                        RehabilitarDbContext dbContext)
    {
        _roleManager = roleManager;
        _userManager = userManager;
        _dbContext = dbContext;
    }

    public async Task SeedAsync()
    {
        System.Console.WriteLine();
        System.Console.WriteLine("---------- SEEDING ----------");
        System.Console.WriteLine();
        await SeedRolesAsync();
        await SeedAdminAsync("admin@rehabilitar.com", "Admin", "Administrador");
        
        await SeedClienteAsync("Paul", "Atreides", "paul@atreides.com", "11222333", "542214445566");
        await SeedClienteAsync("Rocky", "Balboa", "rocky@balboa.com", "44555666", "542217778899");
        await SeedClienteAsync("Mr", "Robot", "mr@robot.com", "55666777");
        await SeedClienteAsync("Daenerys", "Targaryen", "daenerys@targaryen.com", "10111222", "541120204040");
        await SeedClienteAsync("Marilina", "Bertoldi", "marilina@bertoldi.com", "22333444");
        await SeedClienteAsync("Ricardo", "Mollo", "ricardo@mollo.com", "33444555", "541110102020");

        await SeedProfesorAsync("Peter", "Parker", "peter@parker.com", TipoEspecialidad.TrenSuperior);
        await SeedProfesorAsync("Bruce", "Wayne", "bruce@wayne.com", TipoEspecialidad.TrenMedio);
        await SeedProfesorAsync("Clark", "Kent", "clark@kent.com", TipoEspecialidad.TrenInferior);

        await SeedSalaAsync("Sala A", 10);
        await SeedSalaAsync("Sala B", 20);
        await SeedSalaAsync("Sala C", 30);
        await SeedSalaAsync("Sala D", 50);
        await SeedSalaAsync("Sala E", 80);

        // await SeedActividadAsync();

        // await SeedReservaAsync();

        System.Console.WriteLine();
        System.Console.WriteLine("---------- FIN SEEDING ----------");
        System.Console.WriteLine();

    }

    private async Task SeedRolesAsync()
    {
        var roles = new[] { "admin", "reception", "professor", "registered_client", "guest" };

        foreach (var roleName in roles)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new Role(roleName));
                Console.WriteLine($"Rol '{roleName}' creado exitosamente.");
            }
        }
    }

    private async Task SeedAdminAsync(string adminEmail, string adminFirstName, string adminLastName)
    {
        var adminUser = await _userManager.FindByEmailAsync(adminEmail);
        if (adminUser != null)
            return;

        adminUser = User.Create(
            firstName: adminFirstName,
            lastName: adminLastName,
            email: adminEmail
        );

        var result = await _userManager.CreateAsync(adminUser, "admin0");

        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(adminUser, "admin");
            await ConfirmarEmail(adminUser);
        }
        else
        {
            System.Console.WriteLine("Error al seedear admin.");
        }

    }

    private async Task SeedClienteAsync(string clientFirstName, string clientLastName, string clientEmail, string clientDni, string? clientTelefono = null)
    {
        User? clientUser = await _userManager.FindByEmailAsync(clientEmail);
        if (clientUser != null)
            return;

        await ExecuteWithTransactionAsync(async () =>
        {
            // crear user:
            clientUser = User.Create(
                firstName: clientFirstName,
                lastName: clientLastName,
                email: clientEmail
            );
            var result = await _userManager.CreateAsync(clientUser, "cliente");
            if (!result.Succeeded)
            {
                System.Console.WriteLine("Error al seedear cliente.");
                return false;
            }

            await _userManager.AddToRoleAsync(clientUser, "registered_client");
            await ConfirmarEmail(clientUser);

            // crear cliente:
            Cliente client = Cliente.Create(
                userId:clientUser.Id,
                fechaNacimiento: DateOnly.FromDateTime(new DateTime(2000, 1, 1)),
                dni: new Dni(clientDni),
                telefono: clientTelefono
            );
            _dbContext.Clientes.Add(client);
            await _dbContext.SaveChangesAsync();

            return true;
        });
    }

    private async Task SeedProfesorAsync(string profesorFirstName, string profesorLastName, string profesorEmail, TipoEspecialidad profesorEspecialidad)
    {
        User? profesorUser = await _userManager.FindByEmailAsync(profesorEmail);
        if (profesorUser != null)
            return;

        await ExecuteWithTransactionAsync(async () =>
        {
            // crear user:
            profesorUser = User.Create(
                firstName: profesorFirstName,
                lastName: profesorLastName,
                email: profesorEmail
            );
            var result = await _userManager.CreateAsync(profesorUser, "profesor");
            if (!result.Succeeded)
            {
                System.Console.WriteLine("Error al seedear profesor.");
                return false;
            }

            await _userManager.AddToRoleAsync(profesorUser, "professor");
            await ConfirmarEmail(profesorUser);
            
            // crear profesor:
            Profesor profesor = Profesor.Create(
                userId: profesorUser.Id,
                especialidad: profesorEspecialidad
            );
            _dbContext.Profesores.Add(profesor);
            await _dbContext.SaveChangesAsync();

            return true;
        });    
    }

    private async Task SeedSalaAsync(string nombre, int capacidad, string? descripcion = null)
    {
        if (await _dbContext.Salas.AnyAsync(s => s.Nombre.Equals(nombre)))
            return;

        Sala sala = Sala.Create(nombre, capacidad, descripcion);
        _dbContext.Salas.Add(sala);
        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedActividadAsync(string nombre, string descripcion, TipoEspecialidad tipo,
                                        FrecuenciaActividad frecuencia, EstadoActividad estado, DateTime fechaYHora,
                                        int cupoMaximo, Guid salaId, Guid? profesorId = null, Guid? serieId = null)
    {
        if (await _dbContext.Actividades.AnyAsync(a =>
            a.FechaYHora.Equals(fechaYHora) &&
            a.SalaId.Equals(salaId)))
                return;

        Actividad actividad = Actividad.Create(nombre, descripcion, tipo, frecuencia,
                                            estado, fechaYHora, cupoMaximo, salaId,
                                            profesorId, serieId);

        _dbContext.Actividades.Add(actividad);
        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedReservaAsync(Guid clienteId, Guid actividadId, DetallePago detallePago, EstadoDeReserva estadoDeReserva)
    {
        if (await _dbContext.Reservas.AnyAsync(r =>
            r.ClienteId.Equals(clienteId) &&
            r.ActividadId.Equals(actividadId)))
                return;

        Reserva reserva = Reserva.Create(clienteId, actividadId, detallePago, estadoDeReserva);

        _dbContext.Reservas.Add(reserva);
        await _dbContext.SaveChangesAsync();
    }

    private async Task ExecuteWithTransactionAsync(Func<Task<bool>> action)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            bool success = await action();

            if (success)
                await transaction.CommitAsync();
            else
                await transaction.RollbackAsync();
        }
        catch (Exception e)
        {
            System.Console.WriteLine("Excepción durante seeding: " + e.Message);
            await transaction.RollbackAsync();
        }
    }

    private async Task ConfirmarEmail(User user)
    {
        // confirmar mail automáticamente:
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        await _userManager.ConfirmEmailAsync(user, token);
    }
}