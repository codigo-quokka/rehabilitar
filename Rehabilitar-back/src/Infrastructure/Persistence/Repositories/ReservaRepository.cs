using Application.Reservas;
using Domain.Reservas;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ReservaRepository : RepositoryBase<Reserva>, IReservaRepository
{
    public ReservaRepository(RehabilitarDbContext context) : base(context) { }

    public override async Task<Reserva?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Reservas
            .Include(r => r.Cliente)
            .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
    }

    public async Task<IEnumerable<Reserva>> GetReservasDeClientePorIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.Reservas
        // .Include(r => r.Actividad) se puede incluir la actividad pero de momento la dejo comentada hasta que se necesite
        .Where(r => r.ClienteId == userId)
        .Include(r => r.Cliente)
        .ThenInclude(c => c.User)
        .AsNoTracking() // con tracking o sin tracking? si necesito las reservas de un cliente probablemente ese cliente deba poder modificarlas, entonces sería sin tracking. Si se modifican así lo cambio.
        .ToListAsync();
    }

    public async Task<IEnumerable<Reserva>> GetReservasDeActividadPorIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Reservas
        .Where(r => r.ActividadId == id)
        .AsNoTracking()
        .ToListAsync();
    }
}
