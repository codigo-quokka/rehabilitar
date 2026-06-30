namespace Application.Usuarios.Requests;

public class EditarUsuarioRequest
{
    public string? Nombre { get; set; }
    public string? Apellido { get; set; }
    public string? Email { get; set; }
    public string? Rol { get; set; }
    public string? Especialidad { get; set; }
    public bool? NotificacionAplicacion { get; set; }
}
