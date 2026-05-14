using Application.Common.Interfaces;
using Domain.Profesores;
using ErrorOr;

namespace Application.Profesores;

public interface IProfesorRepository : IRepositoryBase<Profesor>
{
}
