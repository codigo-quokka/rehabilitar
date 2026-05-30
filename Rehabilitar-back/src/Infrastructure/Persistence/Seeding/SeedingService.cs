using Microsoft.AspNetCore.Identity;
using Domain;
using Domain.Clientes;
using Domain.Profesores;
using Application.Seeding;
using Domain.Salas;
using Microsoft.EntityFrameworkCore;
using Domain.Actividades;
using Domain.AptosFisicos;
using Domain.Reservas;
using Domain.Enums;
using Application.Actividades;
using Application.Actividades.DTOs;

namespace Infrastructure.Persistence.Seeding;

public class SeedingService : ISeedingService
{

    private readonly RoleManager<Role> _roleManager;
    private readonly UserManager<User> _userManager;
    private readonly RehabilitarDbContext _dbContext;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IActividadService _actividadService;

    public SeedingService(RoleManager<Role> roleManager,
                        UserManager<User> userManager,
                        RehabilitarDbContext dbContext,
                        IPasswordHasher<User> passwordHasher,
                        IActividadService actividadService)
    {
        _roleManager = roleManager;
        _userManager = userManager;
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _actividadService = actividadService;
    }

    public async Task SeedRolesAsync()
    {
        var roles = new[] { "Administrador", "Recepción", "Profesor", "Cliente Registrado" };

        foreach (var roleName in roles)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new Role(roleName));
                Console.WriteLine($"Rol '{roleName}' creado exitosamente.");
            }
        }
    }

    public async Task SeedAdminAsync()
    {
        await SeedAdminAsync("admin@rehabilitar.com", "Admin", "Administrador");
    }

    public async Task SeedAsync()
    {
        await SeedReceptionAsync("recepcion@rehabilitar.com", "Recepcion", "Receptionist");
        
        await SeedClienteAsync("Paul", "Atreides", "paul@atreides.com", "11222333", "542214445566");
        await SeedClienteAsync("Rocky", "Balboa", "rocky@balboa.com", "44555666", "542217778899");
        await SeedClienteAsync("Mr", "Robot", "mr@robot.com", "55666777");
        await SeedClienteAsync("Daenerys", "Targaryen", "daenerys@targaryen.com", "10111222", "541120204040");
        await SeedClienteAsync("Marilina", "Bertoldi", "marilina@bertoldi.com", "22333444");
        await SeedClienteAsync("Ricardo", "Mollo", "ricardo@mollo.com", "33444555", "541110102020");
        await SeedClienteAsync("José", "Hernández", "joseh@gmail.com", "10000000", password: "Jose123!");
        await SeedClienteAsync("Morgan", "Freeman", "morgan@freeman.com", "77888999", "542211112233");
        await SeedClienteAsync("Ellen", "Ripley", "ellen@ripley.com", "88999000", "542213334455");
        await SeedClienteAsync("Tony", "Stark", "tony@stark.com", "99000111", "542215556677");
        await SeedClienteAsync("Sarah", "Connor", "sarah@connor.com", "11122333");
        await SeedClienteAsync("Gandalf", "Gris", "gandalf@gris.com", "22233444", "542217778899");
        await SeedClienteAsync("Leia", "Organa", "leia@organa.com", "33344555");

        await SeedProfesorAsync("Peter", "Parker", "peter@parker.com", TipoEspecialidad.TrenSuperior);
        await SeedProfesorAsync("Bruce", "Wayne", "bruce@wayne.com", TipoEspecialidad.TrenMedio);
        await SeedProfesorAsync("Clark", "Kent", "clark@kent.com", TipoEspecialidad.TrenInferior);
        await SeedProfesorAsync("Diana", "Prince", "diana@prince.com", TipoEspecialidad.TrenSuperior);
        await SeedProfesorAsync("Steve", "Rogers", "steve@rogers.com", TipoEspecialidad.TrenMedio);
        await SeedProfesorAsync("Natasha", "Romanoff", "natasha@romanoff.com", TipoEspecialidad.TrenInferior);

        var salaA = Sala.Create("Sala A", 10);
        var salaB = Sala.Create("Sala B", 20);
        var salaC = Sala.Create("Sala C", 30);
        var salaD = Sala.Create("Sala D", 50);
        var salaE = Sala.Create("Sala E", 80);

        await SeedSalaAsync(salaA);
        await SeedSalaAsync(salaB);
        await SeedSalaAsync(salaC);
        await SeedSalaAsync(salaD);
        await SeedSalaAsync(salaE);

        var peter = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "peter@parker.com");
        var clark = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "clark@kent.com");
        var bruce = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "bruce@wayne.com");
        var diana = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "diana@prince.com");
        var steve = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "steve@rogers.com");
        var natasha = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "natasha@romanoff.com");
        var now = DateTime.Today.AddDays(1);
        await SeedActividadAsync("Yoga Terapéutico", "Ejercicios suaves para mejorar la movilidad", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Esporadica, EstadoActividad.Aprobada, now.AddHours(9), 10, salaA.Id, peter.UserId);
        await SeedActividadRecurrenteAsync("Rehabilitación de Hombro", "Fortalecimiento y recuperación articular", TipoEspecialidad.TrenSuperior, EstadoActividad.EnCurso, now.AddDays(1).AddHours(10), 15, 1000, salaB.Id, null, now.AddDays(1).AddHours(10).AddDays(60));
        await SeedActividadRecurrenteAsync("Ejercicios Core", "Trabajo de abdomen y estabilidad lumbar", TipoEspecialidad.TrenMedio, EstadoActividad.Aprobada, now.AddDays(2).AddHours(11), 20, 1000, salaC.Id, null, now.AddDays(2).AddHours(11).AddDays(40));
        await SeedActividadAsync("Fortalecimiento Lumbar", "Prevención y recuperación de lesiones lumbares", TipoEspecialidad.TrenMedio, FrecuenciaActividad.Esporadica, EstadoActividad.Propuesta, now.AddDays(6).AddHours(14), 25, salaD.Id, bruce.UserId);
        await SeedActividadRecurrenteAsync("Rehabilitación de Rodilla", "Ejercicios para recuperación de rodilla", TipoEspecialidad.TrenInferior, EstadoActividad.EnCurso, now.AddHours(8), 12, 1000, salaE.Id, clark.UserId, now.AddHours(8).AddDays(30));
        await SeedActividadRecurrenteAsync("Tonificación General", "Circuito de ejercicios de tonificación", TipoEspecialidad.TrenSuperior, EstadoActividad.Aprobada, now.AddDays(3).AddHours(10), 8, 1000, salaA.Id, null, now.AddDays(3).AddHours(10).AddDays(50));
        await SeedActividadAsync("Estiramientos Asistidos", "Estiramientos guiados con asistencia", TipoEspecialidad.TrenInferior, FrecuenciaActividad.Esporadica, EstadoActividad.Propuesta, now.AddDays(5).AddHours(16), 20, salaB.Id, clark.UserId);
        await SeedActividadRecurrenteAsync("Gimnasia Postural", "Corrección postural y alineación corporal", TipoEspecialidad.TrenMedio, EstadoActividad.EnCurso, now.AddDays(1).AddHours(9), 30, 1000, salaC.Id, bruce.UserId, now.AddDays(1).AddHours(9).AddDays(60));
        await SeedActividadAsync("Pilates Rehabilitador", "Fortalece el core con movimientos controlados", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Esporadica, EstadoActividad.Aprobada, now.AddDays(4).AddHours(8), 5, salaE.Id, diana.UserId);
        await SeedActividadRecurrenteAsync("Aqua Terapia", "Ejercicios de bajo impacto en agua para rehabilitación", TipoEspecialidad.TrenInferior, EstadoActividad.Aprobada, now.AddDays(5).AddHours(15), 15, 1000, salaD.Id, natasha.UserId, now.AddDays(5).AddHours(15).AddDays(45));
        await SeedActividadAsync("Boxeo Terapéutico", "Entrenamiento de boxeo adaptado a pacientes", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Esporadica, EstadoActividad.Propuesta, now.AddDays(7).AddHours(18), 10, salaB.Id, peter.UserId);
        await SeedActividadRecurrenteAsync("Movilidad Articular", "Ejercicios para mejorar el rango de movimiento articular", TipoEspecialidad.TrenMedio, EstadoActividad.EnCurso, now.AddDays(2).AddHours(7), 25, 1000, salaC.Id, steve.UserId, now.AddDays(2).AddHours(7).AddDays(30));
        await SeedActividadAsync("Reeducación Postural Global", "Técnica avanzada de corrección postural global", TipoEspecialidad.TrenMedio, FrecuenciaActividad.Esporadica, EstadoActividad.Aprobada, now.AddDays(4).AddHours(11), 4, salaC.Id, bruce.UserId);
        await SeedActividadRecurrenteAsync("Kinesiología Deportiva", "Preparación física y prevención de lesiones para deportistas", TipoEspecialidad.TrenInferior, EstadoActividad.Aprobada, now.AddDays(6).AddHours(9), 20, 1000, salaE.Id, clark.UserId, now.AddDays(6).AddHours(9).AddDays(60));
        await SeedReservasAsync();
    }

    public async Task SeedAdminAsync()
    {
        await SeedAdminAsync("admin@rehabilitar.com", "Admin", "Administrador");
    }

    public async Task SeedAsync()
    {
        await SeedReceptionAsync("recepcion@rehabilitar.com", "Recepcion", "Receptionist");
        
        await SeedClienteAsync("Paul", "Atreides", "paul@atreides.com", "11222333", "542214445566");
        await SeedClienteAsync("Rocky", "Balboa", "rocky@balboa.com", "44555666", "542217778899");
        await SeedClienteAsync("Mr", "Robot", "mr@robot.com", "55666777");
        await SeedClienteAsync("Daenerys", "Targaryen", "daenerys@targaryen.com", "10111222", "541120204040");
        await SeedClienteAsync("Marilina", "Bertoldi", "marilina@bertoldi.com", "22333444");
        await SeedClienteAsync("Ricardo", "Mollo", "ricardo@mollo.com", "33444555", "541110102020");
        await SeedClienteAsync("José", "Hernández", "joseh@gmail.com", "10000000", password: "Jose123!");
        await SeedClienteAsync("Morgan", "Freeman", "morgan@freeman.com", "77888999", "542211112233");
        await SeedClienteAsync("Ellen", "Ripley", "ellen@ripley.com", "88999000", "542213334455");
        await SeedClienteAsync("Tony", "Stark", "tony@stark.com", "99000111", "542215556677");
        await SeedClienteAsync("Sarah", "Connor", "sarah@connor.com", "11122333");
        await SeedClienteAsync("Gandalf", "Gris", "gandalf@gris.com", "22233444", "542217778899");
        await SeedClienteAsync("Leia", "Organa", "leia@organa.com", "33344555");

        await SeedProfesorAsync("Peter", "Parker", "peter@parker.com", "44455666", TipoEspecialidad.TrenSuperior);
        await SeedProfesorAsync("Bruce", "Wayne", "bruce@wayne.com", "55566777", TipoEspecialidad.TrenMedio);
        await SeedProfesorAsync("Clark", "Kent", "clark@kent.com", "66677888", TipoEspecialidad.TrenInferior);
        await SeedProfesorAsync("Diana", "Prince", "diana@prince.com", "77788999", TipoEspecialidad.TrenSuperior);
        await SeedProfesorAsync("Steve", "Rogers", "steve@rogers.com", "88899000", TipoEspecialidad.TrenMedio);
        await SeedProfesorAsync("Natasha", "Romanoff", "natasha@romanoff.com", "99900111", TipoEspecialidad.TrenInferior);

        var salaA = Sala.Create("Sala A", 10);
        var salaB = Sala.Create("Sala B", 20);
        var salaC = Sala.Create("Sala C", 30);
        var salaD = Sala.Create("Sala D", 50);
        var salaE = Sala.Create("Sala E", 80);

        await SeedSalaAsync(salaA);
        await SeedSalaAsync(salaB);
        await SeedSalaAsync(salaC);
        await SeedSalaAsync(salaD);
        await SeedSalaAsync(salaE);

        var peter = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "peter@parker.com");
        var clark = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "clark@kent.com");
        var bruce = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "bruce@wayne.com");
        var diana = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "diana@prince.com");
        var steve = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "steve@rogers.com");
        var natasha = await _dbContext.Profesores.Include(p => p.User).FirstAsync(p => p.User!.Email == "natasha@romanoff.com");
        var now = DateTime.Today.AddDays(1);
        await SeedActividadAsync("Yoga Terapéutico", "Ejercicios suaves para mejorar la movilidad", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Esporadica, EstadoActividad.Aprobada, now.AddHours(9), 10, salaA.Id, peter.UserId);
        await SeedActividadRecurrenteAsync("Rehabilitación de Hombro", "Fortalecimiento y recuperación articular", TipoEspecialidad.TrenSuperior, EstadoActividad.EnCurso, now.AddDays(1).AddHours(10), 15, 1000, salaB.Id, null, now.AddDays(1).AddHours(10).AddDays(60));
        await SeedActividadRecurrenteAsync("Ejercicios Core", "Trabajo de abdomen y estabilidad lumbar", TipoEspecialidad.TrenMedio, EstadoActividad.Aprobada, now.AddDays(2).AddHours(11), 20, 1000, salaC.Id, null, now.AddDays(2).AddHours(11).AddDays(40));
        await SeedActividadAsync("Fortalecimiento Lumbar", "Prevención y recuperación de lesiones lumbares", TipoEspecialidad.TrenMedio, FrecuenciaActividad.Esporadica, EstadoActividad.Propuesta, now.AddDays(6).AddHours(14), 25, salaD.Id, bruce.UserId);
        await SeedActividadRecurrenteAsync("Rehabilitación de Rodilla", "Ejercicios para recuperación de rodilla", TipoEspecialidad.TrenInferior, EstadoActividad.EnCurso, now.AddHours(8), 12, 1000, salaE.Id, clark.UserId, now.AddHours(8).AddDays(30));
        await SeedActividadRecurrenteAsync("Tonificación General", "Circuito de ejercicios de tonificación", TipoEspecialidad.TrenSuperior, EstadoActividad.Aprobada, now.AddDays(3).AddHours(10), 8, 1000, salaA.Id, null, now.AddDays(3).AddHours(10).AddDays(50));
        await SeedActividadAsync("Estiramientos Asistidos", "Estiramientos guiados con asistencia", TipoEspecialidad.TrenInferior, FrecuenciaActividad.Esporadica, EstadoActividad.Propuesta, now.AddDays(5).AddHours(16), 20, salaB.Id, clark.UserId);
        await SeedActividadRecurrenteAsync("Gimnasia Postural", "Corrección postural y alineación corporal", TipoEspecialidad.TrenMedio, EstadoActividad.EnCurso, now.AddDays(1).AddHours(9), 30, 1000, salaC.Id, bruce.UserId, now.AddDays(1).AddHours(9).AddDays(60));
        await SeedActividadAsync("Pilates Rehabilitador", "Fortalece el core con movimientos controlados", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Esporadica, EstadoActividad.Aprobada, now.AddDays(4).AddHours(8), 5, salaE.Id, diana.UserId);
        await SeedActividadRecurrenteAsync("Aqua Terapia", "Ejercicios de bajo impacto en agua para rehabilitación", TipoEspecialidad.TrenInferior, EstadoActividad.Aprobada, now.AddDays(5).AddHours(15), 15, 1000, salaD.Id, natasha.UserId, now.AddDays(5).AddHours(15).AddDays(45));
        await SeedActividadAsync("Boxeo Terapéutico", "Entrenamiento de boxeo adaptado a pacientes", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Esporadica, EstadoActividad.Propuesta, now.AddDays(7).AddHours(18), 10, salaB.Id, peter.UserId);
        await SeedActividadRecurrenteAsync("Movilidad Articular", "Ejercicios para mejorar el rango de movimiento articular", TipoEspecialidad.TrenMedio, EstadoActividad.EnCurso, now.AddDays(2).AddHours(7), 25, 1000, salaC.Id, steve.UserId, now.AddDays(2).AddHours(7).AddDays(30));
        await SeedActividadAsync("Reeducación Postural Global", "Técnica avanzada de corrección postural global", TipoEspecialidad.TrenMedio, FrecuenciaActividad.Esporadica, EstadoActividad.Aprobada, now.AddDays(4).AddHours(11), 4, salaC.Id, bruce.UserId);
        await SeedActividadRecurrenteAsync("Kinesiología Deportiva", "Preparación física y prevención de lesiones para deportistas", TipoEspecialidad.TrenInferior, EstadoActividad.Aprobada, now.AddDays(6).AddHours(9), 20, 1000, salaE.Id, clark.UserId, now.AddDays(6).AddHours(9).AddDays(60));
        await SeedReservasAsync();
    }

    private async Task SeedAdminAsync(string adminEmail, string adminFirstName, string adminLastName)
    {
        var adminUser = await _userManager.FindByEmailAsync(adminEmail);
        if (adminUser != null)
            return;

        adminUser = User.Create(
            firstName: adminFirstName,
            lastName: adminLastName,
            email: adminEmail,
            dni: "00000000",
            fechaNacimiento: DateOnly.FromDateTime(new DateTime(1990, 1, 1))
        );

        adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, "admin");
        var result = await _userManager.CreateAsync(adminUser);

        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(adminUser, "Administrador");
            await ConfirmarEmail(adminUser);
        }
        else
        {
            System.Console.WriteLine("Error al seedear admin.");
        }

    }

    private async Task SeedReceptionAsync(string receptionEmail, string receptionFirstName, string receptionLastName)
    {
        var receptionUser = await _userManager.FindByEmailAsync(receptionEmail);
        if (receptionUser != null)
            return;

        receptionUser = User.Create(
            firstName: receptionFirstName,
            lastName: receptionLastName,
            email: receptionEmail,
            dni: "11111111",
            fechaNacimiento: DateOnly.FromDateTime(new DateTime(1990, 1, 1))
        );

        receptionUser.PasswordHash = _passwordHasher.HashPassword(receptionUser, "recepcion");
        var result = await _userManager.CreateAsync(receptionUser);

        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(receptionUser, "Recepción");
            await ConfirmarEmail(receptionUser);
        }
        else
        {
            System.Console.WriteLine("Error al seedear recepcionista.");
        }
    }

    private async Task SeedClienteAsync(string clientFirstName, string clientLastName, string clientEmail, string clientDni, string? clientTelefono = null, string? password = null, bool aprobarApto = true)
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
                email: clientEmail,
                dni: clientDni,
                fechaNacimiento: DateOnly.FromDateTime(new DateTime(2000, 1, 1))
            );

            clientUser.PasswordHash = _passwordHasher.HashPassword(clientUser, password ?? "cliente");
            var result = await _userManager.CreateAsync(clientUser);

            if (!result.Succeeded)
            {
                System.Console.WriteLine("Error al seedear cliente.");
                return false;
            }

            await _userManager.AddToRoleAsync(clientUser, "Cliente Registrado");
            await ConfirmarEmail(clientUser);

            // crear cliente:
            Cliente client = Cliente.Create(
                userId:clientUser.Id,
                fechaNacimiento: DateOnly.FromDateTime(new DateTime(2000, 1, 1)),
                dni: new Dni(clientDni),
                telefono: clientTelefono
            );
            if (aprobarApto)
                client.AprobarAptoFisico();
            _dbContext.Clientes.Add(client);
            await _dbContext.SaveChangesAsync();

            return true;
        });
    }

    private async Task SeedProfesorAsync(string profesorFirstName, string profesorLastName, string profesorEmail, string profesorDni, TipoEspecialidad profesorEspecialidad)
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
                email: profesorEmail,
                dni: profesorDni,
                fechaNacimiento: DateOnly.FromDateTime(new DateTime(1990, 1, 1))
            );
            
            profesorUser.PasswordHash = _passwordHasher.HashPassword(profesorUser, "profesor");
            var result = await _userManager.CreateAsync(profesorUser);

            if (!result.Succeeded)
            {
                System.Console.WriteLine("Error al seedear profesor.");
                return false;
            }

            await _userManager.AddToRoleAsync(profesorUser, "Profesor");
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

    private async Task SeedSalaAsync(Sala sala)
    {
        if (await _dbContext.Salas.AnyAsync(s => s.Nombre.Equals(sala.Nombre)))
            return;

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
                                            estado, fechaYHora, cupoMaximo, 1000, salaId,
                                            profesorId, serieId);

        _dbContext.Actividades.Add(actividad);
        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedActividadRecurrenteAsync(string nombre, string descripcion, TipoEspecialidad tipo,
                                        EstadoActividad estado, DateTime fechaInicio,
                                        int cupoMaximo, decimal precio, Guid salaId, Guid? profesorId, DateTime fechaFinRecurrente)
    {
        var request = new CrearActividadRecurrenteRequest(
            new CrearActividadRequest(
                Nombre: nombre,
                Descripcion: descripcion,
                Tipo: tipo,
                Frecuencia: FrecuenciaActividad.Recurrente,
                Estado: estado,
                FechaYHora: fechaInicio,
                // Precio: precio,
                CupoMaximo: cupoMaximo,
                SalaId: salaId,
                ProfesorId: profesorId
            ),
            FechaFinRecurrente: fechaFinRecurrente
        );

        var result = await _actividadService.CrearActividadRecurrente(request);

        if (result.IsError)
        {
            Console.WriteLine($"Error al seedear actividad recurrente '{nombre}': {string.Join(", ", result.Errors)}");
        }
        else
        {
            Console.WriteLine($"Actividad recurrente '{nombre}' creada exitosamente.");
        }
    }

    private async Task SeedReservaAsync(Guid clienteId, Guid actividadId, DetallePago detallePago, EstadoDeReserva estadoDeReserva, TipoCliente tipoCliente)
    {
        if (await _dbContext.Reservas.AnyAsync(r =>
            r.ClienteId.Equals(clienteId) &&
            r.ActividadId.Equals(actividadId)))
                return;

        Reserva reserva = Reserva.Create(clienteId, actividadId, detallePago, estadoDeReserva, tipoCliente);

        _dbContext.Reservas.Add(reserva);
        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedReservasAsync()
    {
        Console.WriteLine("SeedReservasAsync: inicio");

        var clientes = await _dbContext.Clientes.Include(c => c.User).ToListAsync();
        Console.WriteLine($"SeedReservasAsync: {clientes.Count} clientes cargados");

        var actividades = await _dbContext.Actividades.ToListAsync();
        Console.WriteLine($"SeedReservasAsync: {actividades.Count} actividades cargadas");

        // Crear AptoFisico aprobado para cada cliente que no tenga uno
        var adminUser = await _userManager.FindByEmailAsync("admin@rehabilitar.com");
        var existingAptos = await _dbContext.Set<AptoFisico>().Select(a => a.ClienteId).ToHashSetAsync();
        foreach (var c in clientes)
        {
            c.AprobarAptoFisico();
            if (!existingAptos.Contains(c.UserId))
            {
                var seedPdfPath = Path.Combine(AppContext.BaseDirectory, "Persistence", "Seeding", "Apto_Fisico_RehabilitAR.pdf");
                if (!File.Exists(seedPdfPath))
                    seedPdfPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Infrastructure", "Persistence", "Seeding", "Apto_Fisico_RehabilitAR.pdf");
                var pdfBytes = File.Exists(seedPdfPath) ? await File.ReadAllBytesAsync(seedPdfPath) : new byte[] { 0x25, 0x50, 0x44, 0x46 };
                var apto = new AptoFisico(c.UserId, "Apto_Fisico_RehabilitAR.pdf", "application/pdf", pdfBytes, pdfBytes.Length);
                apto.Aprobar(adminUser!.Id);
                _dbContext.Set<AptoFisico>().Add(apto);
                Console.WriteLine($"SeedReservasAsync: apto físico creado y aprobado para {c.User?.Email}");
            }
            else
            {
                Console.WriteLine($"SeedReservasAsync: apto físico ya existente para {c.User?.Email}");
            }
        }

        Cliente Cliente(string email) => clientes.First(c => c.User!.Email == email);
        Actividad Actividad(string nombre) => actividades.First(a => a.Nombre == nombre);

        async Task CrearReserva(Cliente cliente, Actividad actividad, TipoCliente tipoCliente, EstadoDeReserva estado)
        {
            if (await _dbContext.Reservas.AnyAsync(r => r.ClienteId == cliente.UserId && r.ActividadId == actividad.Id))
                return;

            var montoTotal = 1000m;
            var montoPagado = estado == EstadoDeReserva.Activa ? montoTotal : 0;
            var detallePago = new DetallePago(montoTotal, montoPagado);
            var reserva = Reserva.Create(cliente.UserId, actividad.Id, detallePago, estado, tipoCliente);
            _dbContext.Reservas.Add(reserva);
        }

        // Pilates Rehabilitador (cupo 5) - LLENO
        await CrearReserva(Cliente("paul@atreides.com"), Actividad("Pilates Rehabilitador"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("rocky@balboa.com"), Actividad("Pilates Rehabilitador"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("mr@robot.com"), Actividad("Pilates Rehabilitador"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("daenerys@targaryen.com"), Actividad("Pilates Rehabilitador"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("marilina@bertoldi.com"), Actividad("Pilates Rehabilitador"), TipoCliente.Abonado, EstadoDeReserva.Activa);

        // Reeducación Postural Global (cupo 4) - LLENO
        await CrearReserva(Cliente("ricardo@mollo.com"), Actividad("Reeducación Postural Global"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("joseh@gmail.com"), Actividad("Reeducación Postural Global"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("morgan@freeman.com"), Actividad("Reeducación Postural Global"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("ellen@ripley.com"), Actividad("Reeducación Postural Global"), TipoCliente.noAbonado, EstadoDeReserva.Activa);

        // Tonificación General (cupo 8) - LLENO
        await CrearReserva(Cliente("tony@stark.com"), Actividad("Tonificación General"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("sarah@connor.com"), Actividad("Tonificación General"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("gandalf@gris.com"), Actividad("Tonificación General"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("leia@organa.com"), Actividad("Tonificación General"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("paul@atreides.com"), Actividad("Tonificación General"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("rocky@balboa.com"), Actividad("Tonificación General"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("mr@robot.com"), Actividad("Tonificación General"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("daenerys@targaryen.com"), Actividad("Tonificación General"), TipoCliente.noAbonado, EstadoDeReserva.Activa);

        // Yoga Terapéutico (cupo 10) - parcial con cancelada
        await CrearReserva(Cliente("marilina@bertoldi.com"), Actividad("Yoga Terapéutico"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("ricardo@mollo.com"), Actividad("Yoga Terapéutico"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("joseh@gmail.com"), Actividad("Yoga Terapéutico"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("morgan@freeman.com"), Actividad("Yoga Terapéutico"), TipoCliente.noAbonado, EstadoDeReserva.Cancelada);

        // Rehabilitación de Rodilla (cupo 12) - parcial con pendiente
        await CrearReserva(Cliente("ellen@ripley.com"), Actividad("Rehabilitación de Rodilla"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("tony@stark.com"), Actividad("Rehabilitación de Rodilla"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("sarah@connor.com"), Actividad("Rehabilitación de Rodilla"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("gandalf@gris.com"), Actividad("Rehabilitación de Rodilla"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("leia@organa.com"), Actividad("Rehabilitación de Rodilla"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("paul@atreides.com"), Actividad("Rehabilitación de Rodilla"), TipoCliente.Abonado, EstadoDeReserva.PendienteDePago);

        // Aqua Terapia (cupo 15) - parcial con pendiente
        await CrearReserva(Cliente("rocky@balboa.com"), Actividad("Aqua Terapia"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("mr@robot.com"), Actividad("Aqua Terapia"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("daenerys@targaryen.com"), Actividad("Aqua Terapia"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("marilina@bertoldi.com"), Actividad("Aqua Terapia"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("ricardo@mollo.com"), Actividad("Aqua Terapia"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("joseh@gmail.com"), Actividad("Aqua Terapia"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("morgan@freeman.com"), Actividad("Aqua Terapia"), TipoCliente.noAbonado, EstadoDeReserva.PendienteDePago);

        // Kinesiología Deportiva (cupo 20) - parcial
        await CrearReserva(Cliente("ellen@ripley.com"), Actividad("Kinesiología Deportiva"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("tony@stark.com"), Actividad("Kinesiología Deportiva"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("sarah@connor.com"), Actividad("Kinesiología Deportiva"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("gandalf@gris.com"), Actividad("Kinesiología Deportiva"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("leia@organa.com"), Actividad("Kinesiología Deportiva"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("paul@atreides.com"), Actividad("Kinesiología Deportiva"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("rocky@balboa.com"), Actividad("Kinesiología Deportiva"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("mr@robot.com"), Actividad("Kinesiología Deportiva"), TipoCliente.Abonado, EstadoDeReserva.Activa);

        // Boxeo Terapéutico (cupo 10) - solo pendientes
        await CrearReserva(Cliente("daenerys@targaryen.com"), Actividad("Boxeo Terapéutico"), TipoCliente.noAbonado, EstadoDeReserva.PendienteDePago);
        await CrearReserva(Cliente("marilina@bertoldi.com"), Actividad("Boxeo Terapéutico"), TipoCliente.Abonado, EstadoDeReserva.PendienteDePago);
        await CrearReserva(Cliente("ricardo@mollo.com"), Actividad("Boxeo Terapéutico"), TipoCliente.noAbonado, EstadoDeReserva.PendienteDePago);

        // Movilidad Articular (cupo 25) - parcial
        await CrearReserva(Cliente("joseh@gmail.com"), Actividad("Movilidad Articular"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("morgan@freeman.com"), Actividad("Movilidad Articular"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("ellen@ripley.com"), Actividad("Movilidad Articular"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("tony@stark.com"), Actividad("Movilidad Articular"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("sarah@connor.com"), Actividad("Movilidad Articular"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("gandalf@gris.com"), Actividad("Movilidad Articular"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("leia@organa.com"), Actividad("Movilidad Articular"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("paul@atreides.com"), Actividad("Movilidad Articular"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("rocky@balboa.com"), Actividad("Movilidad Articular"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("mr@robot.com"), Actividad("Movilidad Articular"), TipoCliente.Abonado, EstadoDeReserva.Activa);

        // Ejercicios Core (cupo 20) - parcial
        await CrearReserva(Cliente("leia@organa.com"), Actividad("Ejercicios Core"), TipoCliente.Abonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("sarah@connor.com"), Actividad("Ejercicios Core"), TipoCliente.noAbonado, EstadoDeReserva.Activa);
        await CrearReserva(Cliente("gandalf@gris.com"), Actividad("Ejercicios Core"), TipoCliente.Abonado, EstadoDeReserva.Activa);

        // Fortalecimiento Lumbar (cupo 25) - solo pendientes
        await CrearReserva(Cliente("tony@stark.com"), Actividad("Fortalecimiento Lumbar"), TipoCliente.Abonado, EstadoDeReserva.PendienteDePago);
        await CrearReserva(Cliente("ellen@ripley.com"), Actividad("Fortalecimiento Lumbar"), TipoCliente.noAbonado, EstadoDeReserva.PendienteDePago);

        Console.WriteLine("SeedReservasAsync: guardando cambios...");
        await _dbContext.SaveChangesAsync();
        Console.WriteLine("SeedReservasAsync: cambios guardados OK");

        // Actualizar CupoOcupado según reservas activas
        var filasAfectadas = await _dbContext.Database.ExecuteSqlRawAsync(
            "UPDATE Actividades SET CupoOcupado = (SELECT COUNT(*) FROM Reservas WHERE Reservas.ActividadId = Actividades.Id AND Reservas.EstadoDeReserva = 1)");
        Console.WriteLine($"SeedReservasAsync: CupoOcupado actualizado ({filasAfectadas} filas)");
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