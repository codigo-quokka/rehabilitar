namespace Application.Profesores;

using Application.Actividades;
using Application.Actividades.DTOs;
using Application.Pagos;
using Application.Salas;
using ErrorOr;
using Domain.Salas;

public class ProfesorService : IProfesorService
{
    private readonly IActividadRepository _actividadRepo;
    private readonly ISalaRepository _salaRepo;
    private readonly IProfesorRepository _profesorRepo;
    private readonly IIntencionPagoRepository _intencionPagoRepository;

    public ProfesorService(
        IActividadRepository actividadRepo,
        ISalaRepository salaRepo,
        IProfesorRepository profesorRepo,
        IIntencionPagoRepository intencionPagoRepository)
    {
        _actividadRepo = actividadRepo;
        _salaRepo = salaRepo;
        _profesorRepo = profesorRepo;
        _intencionPagoRepository = intencionPagoRepository;
    }

    public async Task<ErrorOr<List<ActividadResponse>>> ObtenerMisClases(Guid profesorId, CancellationToken ct = default)
    {
        var profesor = await _profesorRepo.GetByIdAsync(profesorId, ct);
        if (profesor == null)
            return Error.NotFound("Profesor no encontrado");

        var actividades = await _actividadRepo.ListarPorProfesorIdAsync(profesorId, ct);
        var responses = new List<ActividadResponse>();

        foreach (var actividad in actividades)
        {
            var nombreSala = await _salaRepo.GetByIdAsync(actividad.SalaId, ct) is Sala sala ? sala.Nombre : "Sala no encontrada";
            string? nombreProfesor = null;
            if (actividad.ProfesorId.HasValue)
            {
                var prof = await _profesorRepo.GetByIdAsync(actividad.ProfesorId.Value, ct);
                if (prof != null)
                    nombreProfesor = prof.User.FirstName + " " + prof.User.LastName;
            }

            int intencionesPendientes = await _intencionPagoRepository.ContarIntencionesPendientesRecientesAsync(actividad.Id, TimeSpan.FromMinutes(15));
            bool probabilidad = actividad.CupoMaximo > 0 && (actividad.CupoOcupado + intencionesPendientes) >= actividad.CupoMaximo;

            responses.Add(new ActividadResponse(
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
                probabilidad
            ));
        }

        return responses;
    }
}