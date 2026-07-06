using Application.Common.Interfaces;
using Application.Usuarios;
using Domain.Notificaciones;
using ErrorOr;

namespace Application.Notificaciones;

public class NotificacionService : INotificacionService
{
    private readonly INotificacionRepository _notificacionRepository;
    private readonly IUnitOfWork _uow;
    private readonly IUsuarioRepository _usuarioRepository;

    public NotificacionService(INotificacionRepository notificacionRepository, IUnitOfWork unitOfWork, IUsuarioRepository usuarioRepository)
    {
        _notificacionRepository = notificacionRepository;
        _uow = unitOfWork;
        _usuarioRepository = usuarioRepository;
    }

    public async Task<ErrorOr<NotificacionDTO>> CrearNotificacionAsync(Guid userId, string titulo, string mensaje, CancellationToken ct = default)
    {
        var user = await _usuarioRepository.GetByIdAsync(userId, ct);
        if (user is not null && !user.NotificacionAplicacion)
            return Error.Forbidden("Notificaciones.Deshabilitadas", "El usuario tiene las notificaciones deshabilitadas.");

        var notificacion = Notificacion.Create(userId, titulo, mensaje);
        _notificacionRepository.Add(notificacion);
        await _uow.SaveChangesAsync(ct);

        return MapToDto(notificacion);
    }

    public async Task<ErrorOr<NotificacionDTO>> MarcarNotificacionComoLeidaAsync(Guid notificacionId, CancellationToken ct = default)
    {
        var notificacion = await _notificacionRepository.GetByIdAsync(notificacionId, ct);
        if (notificacion == null)
            return Error.NotFound("Notificación no encontrada.");

        notificacion.MarcarComoLeida();
        await _uow.SaveChangesAsync(ct);

        return MapToDto(notificacion);
    }

    public async Task<ErrorOr<NotificacionDTO>> MarcarNotificacionComoNoLeidaAsync(Guid notificacionId, CancellationToken ct = default)
    {
        var notificacion = await _notificacionRepository.GetByIdAsync(notificacionId, ct);
        if (notificacion == null)
            return Error.NotFound("Notificación no encontrada.");

        notificacion.MarcarComoNoLeida();
        await _uow.SaveChangesAsync(ct);

        return MapToDto(notificacion);
    }

    public async Task<ErrorOr<Deleted>> EliminarNotificacionAsync(Guid notificacionId, CancellationToken ct = default)
    {
        var notificacion = await _notificacionRepository.GetByIdAsync(notificacionId, ct);
        if (notificacion == null)
            return Error.NotFound("Notificación no encontrada.");

        _notificacionRepository.Remove(notificacion);
        await _uow.SaveChangesAsync(ct);

        return Result.Deleted;
    }

    public async Task<ErrorOr<NotificacionDTO>> GetNotificacionPorIdAsync(Guid notificacionId, CancellationToken ct = default)
    {
        var notificacion = await _notificacionRepository.GetByIdAsync(notificacionId, ct);
        if (notificacion == null)
            return Error.NotFound("Notificación no encontrada.");

        return MapToDto(notificacion);
    }

    public async Task<ErrorOr<IEnumerable<NotificacionDTO>>> GetNotificacionesPorUsuarioAsync(Guid userId, CancellationToken ct = default)
    {
        var notificaciones = await _notificacionRepository.GetByUserIdAsync(userId, ct);
        return notificaciones.Select(MapToDto).ToList();
    }

    private NotificacionDTO MapToDto(Notificacion notificacion)
    {
        return new NotificacionDTO
        {
            Id = notificacion.Id,
            UserId = notificacion.UserId,
            Titulo = notificacion.Titulo,
            Mensaje = notificacion.Mensaje,
            FechaCreacion = notificacion.FechaCreacion,
            Leida = notificacion.Leida
        };
    }
}
