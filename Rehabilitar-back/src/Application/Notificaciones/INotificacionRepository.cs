using Application.Common.Interfaces;
using Domain.Notificaciones;

namespace Application.Notificaciones;

public interface INotificacionRepository : IRepositoryBase<Notificacion>
{
    Task<IEnumerable<Notificacion>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
}