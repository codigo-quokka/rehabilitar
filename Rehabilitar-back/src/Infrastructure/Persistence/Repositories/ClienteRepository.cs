using Application.Clientes;
using Domain.Clientes;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ClienteRepository : RepositoryBase<Cliente>, IClienteRepository
{
    public ClienteRepository(RehabilitarDbContext context) : base(context) { }

    public async Task<Cliente?> GetByDniAsync(string dni, CancellationToken ct = default)
    {
        return await _context.Clientes.FirstOrDefaultAsync(c => c.Dni.Valor == dni, ct);
    }
}
