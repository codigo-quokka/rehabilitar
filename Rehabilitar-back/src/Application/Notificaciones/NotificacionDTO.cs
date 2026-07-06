namespace Application.Notificaciones;

public record class NotificacionDTO
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Titulo { get; init; } = null!;
    public string Mensaje { get; init; } = null!;
    public DateTime FechaCreacion { get; init; }
    public bool Leida { get; init; }
}
