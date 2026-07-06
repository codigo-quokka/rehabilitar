using Application.Notificaciones;
using Domain.Notificaciones;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class NotificacionRepository : RepositoryBase<Notificacion>, INotificacionRepository
{
    public NotificacionRepository(RehabilitarDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Notificacion>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.Notificaciones
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.FechaCreacion)
            .ToListAsync(ct);
    }
}
