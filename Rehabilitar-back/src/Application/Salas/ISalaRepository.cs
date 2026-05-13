using Application.Common.Interfaces;
using Domain.Salas;

namespace Application.Salas;

public interface ISalaRepository : IRepositoryBase<Sala>
{
    Task<bool> ExisteSalaConNombre(string nombre, Guid? idExcluido = null);
}