using Application.Common.Interfaces;

namespace Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly RehabilitarDbContext _context;

    public UnitOfWork(RehabilitarDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct)
    {
        return await _context.SaveChangesAsync(ct);
    }
}
