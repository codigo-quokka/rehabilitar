namespace Application.Auth.DTOs;

public class UserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public string? Telefono { get; set; }
    public string? FechaNacimiento { get; set; }
    public string? Documento { get; set; }
}