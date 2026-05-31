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

namespace Application.Actividades;

public class ActividadService : IActividadService
{
    const decimal MONTO = 1000;
    public readonly IActividadRepository _actividadRepo;
    public readonly ISalaRepository _salaRepo;
    public readonly IProfesorRepository _profesorRepo;
    public readonly IClienteRepository _clienteRepo;
    private readonly IUnitOfWork _uow;

    public ActividadService(IActividadRepository actividadRepo,
                            ISalaRepository salaRepo,
                            IProfesorRepository profesorRepo,
                            IClienteRepository clienteRepo,
                            IUnitOfWork uow)
    {
        _actividadRepo = actividadRepo;
        _salaRepo = salaRepo;
        _profesorRepo = profesorRepo;
        _clienteRepo = clienteRepo;
        _uow = uow;
    }

    public async Task<ErrorOr<ActividadResponse>> CrearActividad(CrearActividadRequest request, CancellationToken ct = default)
    {   
        var validacion = await ValidarActividad(null, request.CupoMaximo, request.SalaId, request.FechaYHora, request.ProfesorId, request.Tipo, request.Estado, request.SerieId ?? Guid.Empty, ct);
        
        if (validacion.IsError)
            return validacion.Errors;
        
        Actividad actividad = Actividad.Create(request.Nombre, request.Descripcion, request.Tipo, request.Frecuencia, request.Estado, request.FechaYHora, request.CupoMaximo, MONTO, request.SalaId, request.ProfesorId, request.SerieId);
        
        _actividadRepo.Add(actividad);
        await _uow.SaveChangesAsync(ct);
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

        return await MapToDto(actividadesCreadas.First(), ct);
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

        actividad.ModificarActividad(actividadEditada);
        await _uow.SaveChangesAsync(ct);
        return await MapToDto(actividad, ct);
    }

    public async Task<ErrorOr<Deleted>> EliminarActividad(Guid id, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        actividad.CancelarActividad();
        _actividadRepo.Remove(actividad);
        await _uow.SaveChangesAsync(ct);
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
            return Error.Conflict("La actividad ya tiene un profesor asignado.");

        var profesor = await _profesorRepo.GetByIdAsync(request.ProfesorId, ct);
        if (profesor == null)
            return Error.NotFound("Profesor no encontrado");

        if (profesor.Especialidad != actividad.Tipo)
            return Error.Validation("El profesor no tiene la especialidad requerida para esta actividad");

        if (await _actividadRepo.ExisteActividadSuperpuestaEnProfesorAsync(profesor.UserId, actividad.FechaYHora, id, actividad.SerieId ?? Guid.Empty, ct))
            return Error.Conflict("El profesor ya tiene una actividad en ese horario.");

        actividad.AsignarProfesor(request.ProfesorId);
        await _uow.SaveChangesAsync(ct);
        return await MapToDto(actividad, ct);
    }

    public async Task<ErrorOr<ActividadResponse>> RemoverProfesorActividad(Guid id, RemoverProfesorRequest request, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        if (actividad.ProfesorId != request.ProfesorId)
            return Error.Validation("No puedes darte de baja de una actividad que no tienes asignada.");

        if (actividad.Estado == EstadoActividad.Finalizada || actividad.Estado == EstadoActividad.Cancelada)
            return Error.Validation("No puedes darte de baja de una actividad finalizada o cancelada.");

        actividad.RemoverProfesor();
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
        if (cliente == null) return Error.NotFound("Cliente no encontrado");

        var actividad = await _actividadRepo.ObtenerPorIdAsync(actividadId, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");

        var reserva = actividad.Reservas.FirstOrDefault(r => r.ClienteId == cliente.UserId && r.EstadoDeReserva == EstadoDeReserva.Activa);
        if (reserva == null) return Error.NotFound("Reserva no encontrada");

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
            actividad.SalaId,
            nombreSala,
            actividad.ProfesorId,
            nombreProfesor,
            actividad.SerieId,
            actividad.ProbabilidadListaEspera
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
            return Error.Conflict($"La sala no está disponible el {fechaYHora.ToString("dd/MM/yyyy")} a las {fechaYHora.ToString("HH:mm")}");

        Profesor? profesor;
        if (profesorId.HasValue)
        {
            profesor = await _profesorRepo.GetByIdAsync(profesorId.Value, ct);
            
            if (profesor == null) 
                return Error.NotFound("Profesor no encontrado");

            if (profesor.Especialidad != tipo) 
                return Error.Validation("El profesor no tiene la especialidad requerida para esta actividad");

            if (await _actividadRepo.ExisteActividadSuperpuestaEnProfesorAsync(profesor.UserId, fechaYHora, id, serieId, ct))
                return Error.Conflict($"El profesor no está disponible el {fechaYHora.ToString("dd/MM/yyyy")} a las {fechaYHora.ToString("HH:mm")}");
        }

        return Result.Success;
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
