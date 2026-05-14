using Domain.Profesores;
using ErrorOr;

namespace Application.Profesores;

public interface IProfesorRepository
{
    Task<ErrorOr<Profesor>> obtenerPorIdAsync(Guid userId, CancellationToken ct = default);
}
