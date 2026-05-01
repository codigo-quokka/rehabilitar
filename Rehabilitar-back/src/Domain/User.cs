using Microsoft.AspNetCore.Identity;

namespace Domain;

public class User : IdentityUser<Guid>
{
    public string FirstName {get; private set;}
    public string LastName {get; private set;}
    public DateOnly FechaNacimiento {get; private set;}
    public string Dni {get; private set;}

    public ICollection<Reserva>? Reservas {get; private set;}

    // constructor vacío para EF Core.
    #nullable disable
    public User() { }
    #nullable enable

    public User(string firstName, string lastName, DateOnly fechaNacimiento, string email, string dni, string? telefono = null)
    {
        Id = Guid.NewGuid();
        FirstName = firstName;
        LastName = lastName;
        FechaNacimiento = fechaNacimiento;
        UserName = email;
        Email = email;
        Dni = dni;
        PhoneNumber = telefono;
    }
}
