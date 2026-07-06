using Domain.Actividades;
using Domain.Reservas;
using Domain.Profesores;
using Domain.Salas;
using Domain.Clientes;
using Application.Common.Interfaces;
using ErrorOr;
using Application.Actividades.DTOs;
using Application.Reservas.DTOs;
using Application.Salas;
using Application.Profesores;
using Application.Clientes;
using Application.Pagos;
using Microsoft.Extensions.Logging;

namespace Application.Actividades;

public class ActividadService : IActividadService
{
    const decimal MONTO = 1000;
    public readonly IActividadRepository _actividadRepo;
    public readonly ISalaRepository _salaRepo;
    public readonly IProfesorRepository _profesorRepo;
    public readonly IClienteRepository _clienteRepo;
    private readonly IIntencionPagoRepository _intencionPagoRepository;
    private readonly IUnitOfWork _uow;
    private readonly IEmailService _emailService;
    private readonly ILogger<ActividadService> _logger;

    public ActividadService(IActividadRepository actividadRepo,
                            ISalaRepository salaRepo,
                            IProfesorRepository profesorRepo,
                            IClienteRepository clienteRepo,
                            IIntencionPagoRepository intencionPagoRepository,
                            IUnitOfWork uow,
                            IEmailService emailService,
                            ILogger<ActividadService> logger)
    {
        _actividadRepo = actividadRepo;
        _salaRepo = salaRepo;
        _profesorRepo = profesorRepo;
        _clienteRepo = clienteRepo;
        _intencionPagoRepository = intencionPagoRepository;
        _uow = uow;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<ErrorOr<ActividadResponse>> CrearActividad(CrearActividadRequest request, CancellationToken ct = default)
    {   
        var validacion = await ValidarActividad(null, request.CupoMaximo, request.SalaId, request.FechaYHora, request.ProfesorId, request.Tipo, request.Estado, request.SerieId ?? Guid.Empty, ct);
        
        if (validacion.IsError)
            return validacion.Errors;
        
        Actividad actividad = Actividad.Create(request.Nombre, request.Descripcion, request.Tipo, request.Frecuencia, request.Estado, request.FechaYHora, request.CupoMaximo, MONTO, request.SalaId, request.ProfesorId, request.SerieId);
        
        _actividadRepo.Add(actividad);
        await _uow.SaveChangesAsync(ct);

        if (request.ProfesorId.HasValue)
        {
            await EnviarEmailProfesorAsignado(request.ProfesorId.Value, actividad.Nombre, actividad.FechaYHora, ct);
        }

        return await MapToDto(actividad,ct);
    }

    public async Task<ErrorOr<ActividadResponse>> CrearActividadRecurrente(CrearActividadRecurrenteRequest request, CancellationToken ct = default)
    {
        if (request.FechaFinRecurrente <= request.ActividadBase.FechaYHora)
            return Error.Validation("La fecha fin de recurrencia debe ser posterior a la fecha de inicio.");

        Guid serieId = Guid.NewGuid();
        
        DateTime fechaInicio = request.ActividadBase.FechaYHora;
        var fechas = GenerarFechasDeSerie(fechaInicio, request.FechaFinRecurrente);

        var validacionLote = await ValidarLoteDeDisponibilidad(
            fechas.Select(f => (f, (Guid?)null)),
            request.ActividadBase.CupoMaximo,
            request.ActividadBase.SalaId,
            request.ActividadBase.ProfesorId,
            request.ActividadBase.Tipo,
            request.ActividadBase.Estado,
            serieId,
            ct);

        if (validacionLote.IsError)
            return validacionLote.Errors;

        var actividadesCreadas = fechas.Select(f => Actividad.Create(
            request.ActividadBase.Nombre,
            request.ActividadBase.Descripcion,
            request.ActividadBase.Tipo,
            request.ActividadBase.Frecuencia,
            request.ActividadBase.Estado,
            f,
            request.ActividadBase.CupoMaximo,
            MONTO,
            request.ActividadBase.SalaId,
            request.ActividadBase.ProfesorId,
            serieId)).ToList();

        foreach(Actividad a in actividadesCreadas) _actividadRepo.Add(a);
        await _uow.SaveChangesAsync(ct);

        var primera = actividadesCreadas.First();
        if (request.ActividadBase.ProfesorId.HasValue)
        {
            await EnviarEmailProfesorAsignado(request.ActividadBase.ProfesorId.Value, primera.Nombre, primera.FechaYHora, ct);
        }

        return await MapToDto(primera, ct);
    }

    public async Task<ErrorOr<ActividadResponse>> ModificarActividadRecurrente(EditarActividadRecurrenteRequest request, CancellationToken ct = default)
    {
        var actividades = await _actividadRepo.ListarPorSerieIdAsync(request.SerieId, ct);
        var futuras = actividades.Where(a => a.FechaYHora > DateTime.Now).OrderBy(a => a.FechaYHora).ToList();

        if (!futuras.Any()) return Error.NotFound("No se encontraron actividades futuras para esta serie.");

        // Calcular el desplazamiento basado en la primera actividad futura
        var desplazamiento = request.ActividadBase.FechaYHora - futuras.First().FechaYHora;

        // Validar TODAS las actividades antes de modificar
        var itemsAValidar = futuras.Select(a => (a.FechaYHora + desplazamiento, (Guid?)a.Id));
        var validacionLote = await ValidarLoteDeDisponibilidad(
            itemsAValidar,
            request.ActividadBase.CupoMaximo,
            request.ActividadBase.SalaId,
            request.ActividadBase.ProfesorId,
            request.ActividadBase.Tipo,
            request.ActividadBase.Estado,
            request.SerieId,
            ct);

        if (validacionLote.IsError) return validacionLote.Errors;

        // Aplicar cambios
        foreach (var act in futuras)
        {
            var nuevaFecha = act.FechaYHora + desplazamiento;
            var datosEditados = Actividad.Create(
                request.ActividadBase.Nombre,
                request.ActividadBase.Descripcion,
                request.ActividadBase.Tipo,
                request.ActividadBase.Frecuencia,
                request.ActividadBase.Estado,
                nuevaFecha,
                request.ActividadBase.CupoMaximo,
                MONTO,
                request.ActividadBase.SalaId,
                request.ActividadBase.ProfesorId,
                act.SerieId);
            
            act.ModificarActividad(datosEditados);
        }

        await _uow.SaveChangesAsync(ct);
        return await MapToDto(futuras.First(), ct);
    }

    public async Task<ErrorOr<ActividadResponse>> EditarActividad(Guid id, EditarActividadRequest request, CancellationToken ct = default)
    {
        Actividad? actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);

        if (actividad == null) return Error.NotFound("Actividad no encontrada");   

        var validacion = await ValidarActividad(id, request.CupoMaximo, request.SalaId, request.FechaYHora, request.ProfesorId, request.Tipo, request.Estado, request.SerieId ?? Guid.Empty, ct);
        
        if (validacion.IsError)
            return validacion.Errors;
        
        Actividad actividadEditada = Actividad.Create(
            request.Nombre,
            request.Descripcion,
            request.Tipo,
            request.Frecuencia,
            request.Estado,
            request.FechaYHora,
            request.CupoMaximo,
            MONTO,
            request.SalaId,
            request.ProfesorId,
            request.SerieId 
        );

        var oldProfesorId = actividad.ProfesorId;

        actividad.ModificarActividad(actividadEditada);
        await _uow.SaveChangesAsync(ct);

        if (request.ProfesorId.HasValue && request.ProfesorId != oldProfesorId)
        {
            await EnviarEmailProfesorAsignado(request.ProfesorId.Value, actividad.Nombre, actividad.FechaYHora, ct);
        }

        return await MapToDto(actividad, ct);
    }

    public async Task<ErrorOr<Deleted>> CancelarActividad(Guid id, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        var reservasActivas = actividad.Reservas?
            .Where(r => r.EstadoDeReserva == EstadoDeReserva.Activa || r.EstadoDeReserva == EstadoDeReserva.EnEspera)
            .ToList() ?? [];

        if (reservasActivas.Count != 0)
            return Error.Conflict(description: "No se puede cancelar una actividad con clientes inscriptos.");

        actividad.CancelarActividad();
        await _uow.SaveChangesAsync(ct);

        // Notificar a los clientes con reservas
        var clienteIds = actividad.Reservas?
            .Where(r => r.EstadoDeReserva != EstadoDeReserva.Cancelada)
            .Select(r => r.ClienteId)
            .Distinct()
            .ToList() ?? new List<Guid>();

        foreach (var clienteId in clienteIds)
        {
            try
            {
                var cliente = await _clienteRepo.GetByIdAsync(clienteId, ct);
                if (cliente?.User?.Email != null)
                {
                    await _emailService.SendCancelacionDeActividadParaClientesEmail(
                        cliente.User.Email, actividad.Nombre, actividad.FechaYHora, "Cancelada por el administrador");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send activity cancellation email to client {ClienteId}", clienteId);
            }
        }

        // Notificar al profesor si tiene uno asignado
        if (actividad.ProfesorId.HasValue && actividad.Profesor?.User?.Email != null)
        {
            try
            {
                await _emailService.SendCancelacionDeActividadParaProfesoresEmail(
                    actividad.Profesor.User.Email, actividad.Nombre, actividad.FechaYHora, "Cancelada por el administrador");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send activity cancellation email to profesor {ProfesorId}", actividad.ProfesorId);
            }
        }

        return Result.Deleted;
    }

    public async Task<ErrorOr<Deleted>> CancelarSerie(Guid serieId, CancellationToken ct = default)
    {
        var actividades = await _actividadRepo.ListarPorSerieIdAsync(serieId, ct);
        if (!actividades.Any()) return Error.NotFound("No se encontraron actividades para esta serie.");

        foreach (var actividad in actividades)
        {
            if (actividad.FechaYHora > DateTime.Now)
                actividad.CancelarActividad();
        }
        
        await _uow.SaveChangesAsync(ct);

        foreach (var actividad in actividades)
        {
            if (actividad.FechaYHora <= DateTime.Now) continue;

            var clienteIds = actividad.Reservas?
                .Where(r => r.EstadoDeReserva != EstadoDeReserva.Cancelada)
                .Select(r => r.ClienteId)
                .Distinct()
                .ToList() ?? new List<Guid>();

            foreach (var clienteId in clienteIds)
            {
                try
                {
                    var cliente = await _clienteRepo.GetByIdAsync(clienteId, ct);
                    if (cliente?.User?.Email != null)
                    {
                        await _emailService.SendCancelacionDeActividadParaClientesEmail(
                            cliente.User.Email, actividad.Nombre, actividad.FechaYHora, "Cancelada por el administrador");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send activity cancellation email to client {ClienteId}", clienteId);
                }
            }

            if (actividad.ProfesorId.HasValue && actividad.Profesor?.User?.Email != null)
            {
                try
                {
                    await _emailService.SendCancelacionDeActividadParaProfesoresEmail(
                        actividad.Profesor.User.Email, actividad.Nombre, actividad.FechaYHora, "Cancelada por el administrador");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send activity cancellation email to profesor {ProfesorId}", actividad.ProfesorId);
                }
            }
        }

        return Result.Deleted;
    }

    public async Task<ErrorOr<List<ActividadResponse>>> ListarActividades(
        TipoEspecialidad? tipo, FrecuenciaActividad? frecuencia, EstadoActividad? estado, Guid? profesorId, CancellationToken ct)
    {
        var actividades = await _actividadRepo.ListarActividadesAsync(tipo, frecuencia, estado, profesorId, ct);
        var responses = new List<ActividadResponse>();
        foreach (var actividad in actividades)
        {
            var mapped = await MapToDto(actividad, ct);
            if (mapped.IsError)
                return mapped.Errors;
            responses.Add(mapped.Value);
        }
        return responses;
    }

    public async Task<ErrorOr<ActividadResponse>> AsignarProfesorActividad(Guid id, AsignarProfesorRequest request, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        if (actividad.ProfesorId.HasValue && actividad.ProfesorId.Value != Guid.Empty)
            return Error.Conflict(description: "La actividad ya tiene un profesor asignado.");

        var profesor = await _profesorRepo.GetByIdAsync(request.ProfesorId, ct);
        if (profesor == null)
            return Error.NotFound("Profesor no encontrado");

        if (profesor.Especialidad != actividad.Tipo)
            return Error.Validation("El profesor no tiene la especialidad requerida para esta actividad");

        var conflicto = await _actividadRepo.ObtenerActividadSuperpuestaEnProfesorAsync(profesor.UserId, actividad.FechaYHora, id, actividad.SerieId ?? Guid.Empty, ct);
        if (conflicto != null)
            return Error.Conflict(description: $"Ya tienes una actividad en ese horario: {conflicto.Nombre}");

        actividad.AsignarProfesor(request.ProfesorId);
        await _uow.SaveChangesAsync(ct);

        try
        {
            if (profesor.User?.Email != null)
            {
                await _emailService.SendProfesorAsignadoEmail(profesor.User.Email, actividad.Nombre, actividad.FechaYHora);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send professor assignment email for actividad {ActividadId}", id);
        }

        return await MapToDto(actividad, ct);
    }

    public async Task<ErrorOr<ActividadResponse>> RemoverProfesorActividad(Guid id, RemoverProfesorRequest request, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        if (actividad.ProfesorId != request.ProfesorId)
            return Error.Validation(code: "Profesor.NoAsignado", description: "No puedes darte de baja de una actividad que no tienes asignada.");

        if (actividad.Estado == EstadoActividad.Finalizada || actividad.Estado == EstadoActividad.Cancelada)
            return Error.Validation(code: "Profesor.ActividadFinalizadaOCancelada", description: "No puedes darte de baja de una actividad finalizada o cancelada.");

        if (actividad.FechaYHora <= DateTime.Now.AddHours(24))
            return Error.Conflict(code: "Profesor.BajaConMenosDe24Horas", description: "No puedes darte de baja de una actividad que comienza en menos de 24 horas.");

        var removedProfesorId = actividad.ProfesorId;

        actividad.RemoverProfesor();
        await _uow.SaveChangesAsync(ct);

        if (removedProfesorId.HasValue)
        {
            try
            {
                var removedProfesor = await _profesorRepo.GetByIdAsync(removedProfesorId.Value, ct);
                if (removedProfesor?.User?.Email != null)
                {
                    await _emailService.SendOportunidadDeActividadParaProfesoresEmail(
                        removedProfesor.User.Email, actividad.Nombre, actividad.FechaYHora);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send activity opportunity email for actividad {ActividadId}", id);
            }
        }

        return await MapToDto(actividad, ct);
    }

    public async Task<ErrorOr<ActividadResponse>> AprobarActividad(Guid id, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        if (actividad.Estado != EstadoActividad.Propuesta)
            return Error.Conflict("Solo se pueden aprobar actividades en estado Propuesta.");

        List<Actividad> actividadesAAprobar;

        if (actividad.SerieId.HasValue)
        {
            var seriesActivities = await _actividadRepo.ListarPorSerieIdAsync(actividad.SerieId.Value, ct);
            actividadesAAprobar = seriesActivities
                .Where(a => a.Estado == EstadoActividad.Propuesta)
                .ToList();

            if (actividadesAAprobar.Count == 0)
                return Error.Conflict("La serie de actividades ya ha sido aprobada o cancelada.");
        }
        else
        {
            actividadesAAprobar = new List<Actividad> { actividad };
        }

        var items = actividadesAAprobar
            .Select(a => (a.FechaYHora, (Guid?)a.Id))
            .ToList();

        var validacion = await ValidarLoteDeDisponibilidad(
            items,
            actividad.CupoMaximo,
            actividad.SalaId,
            actividad.ProfesorId,
            actividad.Tipo,
            actividad.Estado,
            actividad.SerieId ?? Guid.Empty,
            ct);

        if (validacion.IsError)
            return validacion.Errors;

        foreach (var act in actividadesAAprobar)
        {
            act.Aprobar();
        }

        await _uow.SaveChangesAsync(ct);
        return await MapToDto(actividad, ct);
    }

    public async Task<ErrorOr<Success>> IniciarActividadAsync(Guid id, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        actividad.IniciarClase();
        await _uow.SaveChangesAsync(ct);
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> FinalizarActividadAsync(Guid id, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        var clienteIds = actividad.Reservas
            .Where(r => r.EstadoDeReserva == EstadoDeReserva.Activa && r.Asistencia == EstadoAsistencia.Pendiente)
            .Select(r => r.ClienteId)
            .ToList();

        var clientes = new List<Cliente>();
        foreach (var clienteId in clienteIds)
        {
            var cliente = await _clienteRepo.GetByIdAsync(clienteId, ct);
            if (cliente != null) clientes.Add(cliente);
        }

        actividad.FinalizarClase(clientes);
        await _uow.SaveChangesAsync(ct);
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> RegistrarAsistenciaPorDniAsync(Guid actividadId, string dni, CancellationToken ct = default)
    {
        var cliente = await _clienteRepo.GetByDniAsync(dni, ct);
        if (cliente == null)
            return Error.NotFound(code: "DNI_NO_REGISTRADO", description: "El DNI ingresado no corresponde a ningún cliente registrado");

        var actividad = await _actividadRepo.ObtenerPorIdAsync(actividadId, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        if (actividad.Estado != EstadoActividad.Aprobada && actividad.Estado != EstadoActividad.EnCurso && actividad.Estado != EstadoActividad.Finalizada)
            return Error.Validation(code: "ACTIVIDAD_NO_DISPONIBLE", description: "La actividad no está disponible para registrar asistencia");

        var ahora = DateTime.Now;
        var inicioVentana = actividad.FechaYHora.AddHours(-1);
        var finVentana = actividad.FechaYHora.AddHours(2);

        if (ahora < inicioVentana || ahora > finVentana)
            return Error.Validation(code: "FUERA_DE_VENTANA_HORARIA", description: "Solo se puede registrar asistencia desde 1 hora antes hasta 2 horas después del inicio de la actividad");

        var reserva = actividad.Reservas.FirstOrDefault(r => r.ClienteId == cliente.UserId && r.EstadoDeReserva == EstadoDeReserva.Activa);
        if (reserva == null)
            return Error.NotFound(code: "SIN_RESERVA", description: "El cliente no tiene una reserva activa para esta clase");

        if (reserva.Asistencia == EstadoAsistencia.Presente)
            return Error.Conflict(code: "ASISTENCIA_YA_REGISTRADA", description: "El cliente ya tiene la asistencia registrada para esta clase");

        reserva.MarcarAsistencia();
        cliente.ResetearInasistencias();
        await _uow.SaveChangesAsync(ct);
        return Result.Success;
    }

    public async Task<ErrorOr<ActividadResponse>> ObtenerActividadPorId(Guid id, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");
        return await MapToDto(actividad, ct);
    }

    
    private async Task<ErrorOr<ActividadResponse>> MapToDto(Actividad actividad, CancellationToken ct = default)
    {
        string nombreSala = actividad.Sala?.Nombre ?? string.Empty;
        string? nombreProfesor = actividad.Profesor?.User?.FirstName != null ? $"{actividad.Profesor.User.FirstName} {actividad.Profesor.User.LastName}" : string.Empty;

        int intencionesPendientes = await _intencionPagoRepository.ContarIntencionesPendientesRecientesAsync(actividad.Id, TimeSpan.FromMinutes(15));
        bool probabilidad = actividad.CupoMaximo > 0 && (actividad.CupoOcupado + intencionesPendientes) >= actividad.CupoMaximo;

        return new ActividadResponse(
            actividad.Id,
            actividad.Nombre,
            actividad.Descripcion,
            actividad.FechaYHora,
            actividad.Tipo,
            actividad.Frecuencia,
            actividad.Estado,
            actividad.CupoMaximo,
            actividad.CupoDisponible,
            actividad.Precio,
            actividad.SalaId,
            nombreSala,
            actividad.ProfesorId,
            nombreProfesor,
            actividad.SerieId,
            probabilidad
        );
    }

    private async Task<ErrorOr<Success>> ValidarActividad(Guid? id, int cupoMaximo, Guid salaId, DateTime fechaYHora, Guid? profesorId, TipoEspecialidad tipo, EstadoActividad estado, Guid serieId, CancellationToken ct = default)
    {
        if (estado == EstadoActividad.Finalizada)
            return Error.Validation("No se puede crear o editar una actividad en estado finalizada.");

        if (fechaYHora < DateTime.Now)
            return Error.Validation("La fecha y hora de la actividad no puede ser en el pasado.");

        var sala = await _salaRepo.GetByIdAsync(salaId, ct);
        
        if (sala == null) return Error.NotFound("Sala no encontrada");

        if (!sala.Activo)
            return Error.Validation("No se pueden crear actividades en una sala inactiva.");

        if (cupoMaximo > sala.Capacidad) 
            return Error.Validation($"El cupo máximo no puede exceder la capacidad de la sala ({sala.Capacidad}).");
        
        if (await _actividadRepo.ExisteActividadSuperpuestaEnSalaAsync(sala.Id, fechaYHora, id, serieId, ct))
            return Error.Conflict(description: $"La sala no está disponible el {fechaYHora.ToString("dd/MM/yyyy")} a las {fechaYHora.ToString("HH:mm")}");

        Profesor? profesor;
        if (profesorId.HasValue)
        {
            profesor = await _profesorRepo.GetByIdAsync(profesorId.Value, ct);
            
            if (profesor == null) 
                return Error.NotFound("Profesor no encontrado");

            if (profesor.Especialidad != tipo) 
                return Error.Validation("El profesor no tiene la especialidad requerida para esta actividad");

            if (await _actividadRepo.ExisteActividadSuperpuestaEnProfesorAsync(profesor.UserId, fechaYHora, id, serieId, ct))
                return Error.Conflict(description: $"El profesor no está disponible el {fechaYHora.ToString("dd/MM/yyyy")} a las {fechaYHora.ToString("HH:mm")}");
        }

        return Result.Success;
    }

    private async Task EnviarEmailProfesorAsignado(Guid profesorId, string nombreActividad, DateTime fechaActividad, CancellationToken ct)
    {
        try
        {
            var profesor = await _profesorRepo.GetByIdAsync(profesorId, ct);
            if (profesor?.User?.Email != null)
            {
                await _emailService.SendProfesorAsignadoEmail(profesor.User.Email, nombreActividad, fechaActividad);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send professor assignment email for actividad '{Nombre}'", nombreActividad);
        }
    }

    private List<DateTime> GenerarFechasDeSerie(DateTime fechaInicio, DateTime fechaLimite)
    {
        var fechas = new List<DateTime>();
        for (DateTime fechaIteracion = fechaInicio; 
             fechaIteracion <= fechaLimite; 
             fechaIteracion = fechaIteracion.AddDays(7)) 
        {
            fechas.Add(fechaIteracion);
        }
        return fechas;
    }

    private async Task<ErrorOr<Success>> ValidarLoteDeDisponibilidad(
        IEnumerable<(DateTime Fecha, Guid? ActividadId)> items,
        int cupo,
        Guid salaId,
        Guid? profesorId,
        TipoEspecialidad tipo,
        EstadoActividad estado,
        Guid serieId,
        CancellationToken ct)
    {
        foreach (var item in items)
        {
            var validacion = await ValidarActividad(item.ActividadId, cupo, salaId, item.Fecha, profesorId, tipo, estado, serieId, ct);
            if (validacion.IsError)
                return validacion.Errors;
        }
        return Result.Success;
    }
}
