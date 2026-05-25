using Application.Common.Interfaces;
using Domain.Clientes;

namespace Application.Clientes;

public interface IClienteRepository : IRepositoryBase<Cliente>
{
    Task<Cliente?> GetByDniAsync(string dni, CancellationToken ct = default);
}
