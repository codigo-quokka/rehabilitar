using Application.AptosFisicos;
using Domain.AptosFisicos;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AptoFisicoRepository : RepositoryBase<AptoFisico>, IAptoFisicoRepository
{
    public AptoFisicoRepository(RehabilitarDbContext context) : base(context)
    {
    }

    public override async Task<AptoFisico?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.AptosFisicos
            .Include(a => a.Cliente)
                .ThenInclude(c => c.User)
            .Include(a => a.Evaluador)
            .FirstOrDefaultAsync(a => a.Id == id, ct);
    }

    public async Task<List<AptoFisico>> GetPendientesAsync(CancellationToken ct = default)
    {
        return await _context.AptosFisicos
            .Where(a => a.Estado == EstadoAptoFisico.Pendiente)
            .Include(a => a.Cliente)
                .ThenInclude(c => c.User)
            .OrderByDescending(a => a.FechaSubida)
            .ToListAsync(ct);
    }

    public async Task<AptoFisico?> GetByClienteIdAsync(Guid clienteId, CancellationToken ct = default)
    {
        return await _context.AptosFisicos
            .Where(a => a.ClienteId == clienteId)
            .Include(a => a.Cliente)
                .ThenInclude(c => c.User)
            .Include(a => a.Evaluador)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<List<AptoFisico>> GetUltimoPorClienteAsync(CancellationToken ct = default)
    {
        return await _context.AptosFisicos
            .Include(a => a.Cliente)
                .ThenInclude(c => c.User)
            .Include(a => a.Evaluador)
            .Where(a => !_context.AptosFisicos
                .Any(a2 => a2.ClienteId == a.ClienteId && a2.FechaSubida > a.FechaSubida))
            .OrderBy(a => a.Cliente.User.LastName)
                .ThenBy(a => a.Cliente.User.FirstName)
            .ToListAsync(ct);
    }
}
