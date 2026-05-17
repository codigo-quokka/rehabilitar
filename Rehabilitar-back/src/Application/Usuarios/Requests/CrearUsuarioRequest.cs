namespace Application.Usuarios.Requests;

public class CrearUsuarioRequest
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = "Cliente Registrado";
    public string? Password { get; set; }
    public string? Especialidad { get; set; }
}
