using Application.Common.Interfaces;
using Domain.Actividades;
using Domain.Profesores;
using ErrorOr;

namespace Application.Profesores;

public interface IProfesorRepository : IRepositoryBase<Profesor>
{
    Task<IEnumerable<Profesor>> GetByEspecialidadAsync(TipoEspecialidad especialidad, CancellationToken ct = default);
}
