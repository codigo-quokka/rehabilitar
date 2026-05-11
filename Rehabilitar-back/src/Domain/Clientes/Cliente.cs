namespace Domain.Clientes;

public class Cliente
{
    public Guid UserId { get; private set; }
    public DateOnly FechaNacimiento { get; private set; }
    public Dni Dni { get; private set; }
    public string? Telefono { get; private set; }

    public User? User {get; private set; } // nav EFCore

    // constructor vacío para EF Core.
    #nullable disable
    private Cliente() { }
    #nullable enable

    private Cliente(Guid userId, DateOnly fechaNacimiento, Dni dni, string? telefono = null)
    {
        UserId = userId;
        FechaNacimiento = fechaNacimiento;
        Dni = dni;
        Telefono = telefono;
    }

    // factory
    public static Cliente Create(Guid userId, DateOnly fechaNacimiento, Dni dni, string? telefono = null)
    {
        return new Cliente(userId, fechaNacimiento, dni, telefono);
    }
}