using Application.Salas;
using Domain.Salas;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class SalaRepository : RepositoryBase<Sala>, ISalaRepository
{
    public SalaRepository(RehabilitarDbContext context) : base(context) { }

    public async Task<bool> ExisteSalaConNombre(string nombre, Guid? idExcluido = null, CancellationToken ct = default)
    {
        var query = _context.Salas.Where(s => s.Nombre.ToLower() == nombre.ToLower());
        if (idExcluido.HasValue)
            query = query.Where(s => s.Id != idExcluido);

        return await query.AnyAsync(ct);
    }
}