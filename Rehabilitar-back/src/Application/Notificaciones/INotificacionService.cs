using ErrorOr;

namespace Application.Notificaciones;

public interface INotificacionService
{
    Task<ErrorOr<NotificacionDTO>> CrearNotificacionAsync(Guid userId, string titulo, string mensaje, CancellationToken ct = default);
    Task<ErrorOr<NotificacionDTO>> MarcarNotificacionComoLeidaAsync(Guid notificacionId, CancellationToken ct = default);
    Task<ErrorOr<NotificacionDTO>> MarcarNotificacionComoNoLeidaAsync(Guid notificacionId, CancellationToken ct = default);
    Task<ErrorOr<Deleted>> EliminarNotificacionAsync(Guid notificacionId, CancellationToken ct = default);
    Task<ErrorOr<IEnumerable<NotificacionDTO>>> GetNotificacionesPorUsuarioAsync(Guid userId, CancellationToken ct = default);
    Task<ErrorOr<NotificacionDTO>> GetNotificacionPorIdAsync(Guid notificacionId, CancellationToken ct = default);
}
