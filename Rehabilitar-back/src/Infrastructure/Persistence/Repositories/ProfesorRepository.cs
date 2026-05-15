using Infrastructure.Persistence.Repositories;
using Domain.Profesores;
using Infrastructure.Persistence;
using Application.Profesores;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Profesores;

public class ProfesorRepository : RepositoryBase<Profesor>, IProfesorRepository
{
    public ProfesorRepository(RehabilitarDbContext context) : base(context) { }

    public override async Task<Profesor?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Profesores
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == id, ct);
    }
}
