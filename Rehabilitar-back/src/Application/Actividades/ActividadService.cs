using Domain.Actividades;
using Domain.Profesores;
using Domain.Salas;
using Application.Common.Interfaces;
using ErrorOr;
using Application.Actividades.DTOs;
using Application.Salas;
using Application.Profesores;

namespace Application.Actividades;


public class ActividadService : IActividadService
{
    public readonly IActividadRepository _actividadRepo;
    public readonly ISalaRepository _salaRepo;
    public readonly IProfesorRepository _profesorRepo;
    private readonly IUnitOfWork _uow;

    public ActividadService(IActividadRepository actividadRepo,
                            ISalaRepository salaRepo,
                            IProfesorRepository profesorRepo,
                            IUnitOfWork uow)
    {
        _actividadRepo = actividadRepo;
        _salaRepo = salaRepo;
        _profesorRepo = profesorRepo;
        _uow = uow;
    }

    public async Task<ErrorOr<ActividadResponse>> CrearActividad(CrearActividadRequest request, CancellationToken ct = default)
    {   
        var validacion = await ValidarActividad(null, request.CupoMaximo, request.SalaId, request.FechaYHora, request.ProfesorId, request.Tipo, request.Estado, ct);
        
        if (validacion.IsError)
            return validacion.Errors;
        
        Actividad actividad = Actividad.Create(request.Nombre, request.Descripcion, request.Tipo, request.Frecuencia, request.Estado, request.FechaYHora, request.CupoMaximo, request.SalaId, request.ProfesorId, request.SerieId );
        
        _actividadRepo.Add(actividad);
        await _uow.SaveChangesAsync(ct);
        return await MapToDto(actividad,ct);
    }

    public async Task<ErrorOr<ActividadResponse>> EditarActividad(Guid id, EditarActividadRequest request, CancellationToken ct = default)
    {
        Actividad? actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);

        if (actividad == null) return Error.NotFound("Actividad no encontrada");   

        var validacion = await ValidarActividad(actividad.Id, request.CupoMaximo, request.SalaId, request.FechaYHora, request.ProfesorId, request.Tipo, request.Estado, ct);
        
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
        _actividadRepo.Remove(actividad);
        await _uow.SaveChangesAsync(ct);
        return Result.Deleted;
    }

    public async Task<ErrorOr<List<ActividadResponse>>> ListarActividades(
        TipoEspecialidad? tipo, FrecuenciaActividad? frecuencia, EstadoActividad? estado, CancellationToken ct)
    {
        var actividades = await _actividadRepo.ListarActividadesAsync(tipo, frecuencia, estado, ct);
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

    public async Task<ErrorOr<ActividadResponse>> ObtenerActividadPorId(Guid id, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Actividad no encontrada");
        return await MapToDto(actividad, ct);
    }

    private async Task<ErrorOr<ActividadResponse>> MapToDto(Actividad actividad, CancellationToken ct = default)
    {
        string nombreSala = await _salaRepo.GetByIdAsync(actividad.SalaId, ct) is Sala sala ? sala.Nombre : "Sala no encontrada";
        string? nombreProfesor = null;
        if (actividad.ProfesorId.HasValue)
        {
            var profesor = await _profesorRepo.GetByIdAsync(actividad.ProfesorId.Value, ct);

            if (profesor == null)
                return Error.NotFound("Prfoesor.NotFound", "Profesor no encontrado.");

            nombreProfesor = profesor.User.FirstName + " " + profesor.User.LastName;
        }

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
            actividad.ProfesorId ?? Guid.Empty, // Si no tiene profesor asignado, se devuelve un Guid vacío
            nombreProfesor,
            actividad.SerieId ?? Guid.Empty
        );
    }

    private async Task<ErrorOr<Success>> ValidarActividad(Guid? id, int cupoMaximo, Guid salaId, DateTime fechaYHora, Guid? profesorId, TipoEspecialidad tipo, EstadoActividad estado, CancellationToken ct = default)
    {
        if (estado == EstadoActividad.Finalizada)
            return Error.Validation("No se puede crear o editar una actividad en estado finalizada.");

        var sala = await _salaRepo.GetByIdAsync(salaId, ct);
        
        if (sala == null) return Error.NotFound("Sala no encontrada");

        if (cupoMaximo <= 0 || cupoMaximo > sala.Capacidad) 
            return Error.Validation($"Cupo máximo debe ser mayor a 0 y menor o igual a la capacidad de la sala ({sala.Capacidad})");
        
        if (await _actividadRepo.ExisteActividadSuperpuestaEnSalaAsync(sala.Id, fechaYHora, id, ct))
            return Error.Conflict("La sala no está disponible en la fecha y hora seleccionada");

        Profesor? profesor;
        if (profesorId.HasValue)
        {
            profesor = await _profesorRepo.GetByIdAsync(profesorId.Value, ct);

            // if (profesorResult)
            //     return profesorResult.Errors;
            
            // profesor = profesorResult;
            
            if (profesor == null) 
                return Error.NotFound("Profesor no encontrado");

            if (profesor.Especialidad != tipo) 
                return Error.Validation("El profesor no tiene la especialidad requerida para esta actividad");

            if (await _actividadRepo.ExisteActividadSuperpuestaEnProfesorAsync(profesor.UserId, fechaYHora, id, ct))
                return Error.Conflict("El profesor no está disponible en la fecha y hora seleccionada");
        }

        return Result.Success;
    }
}
