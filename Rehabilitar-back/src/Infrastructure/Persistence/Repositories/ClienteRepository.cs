using Application.Clientes;
using Domain.Clientes;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ClienteRepository : RepositoryBase<Cliente>, IClienteRepository
{
    public ClienteRepository(RehabilitarDbContext context) : base(context) { }

    public async Task<Cliente?> GetByDniAsync(string dni, CancellationToken ct = default)
    {
        var dniValue = new Dni(dni);
        return await _context.Clientes.FirstOrDefaultAsync(c => c.Dni.Equals(dniValue), ct);
    }

    public async Task<bool> DniExistsAsync(string dni, CancellationToken ct = default)
    {
        var dniValue = new Dni(dni);
        return await _context.Clientes.AnyAsync(c => c.Dni.Equals(dniValue), ct);
    }
}
