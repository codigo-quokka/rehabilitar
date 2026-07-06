namespace Application.Notificaciones.Requests;

public record class CrearNotificacionRequest
{
    public Guid UserId { get; init; }
    public string Titulo { get; init; } = null!;
    public string Mensaje { get; init; } = null!;
}
