namespace Application.Profesores;

using Application.Actividades.DTOs;
using ErrorOr;

public interface IProfesorService
{
    Task<ErrorOr<List<ActividadResponse>>> ObtenerMisClases(Guid profesorId, CancellationToken ct = default);
}