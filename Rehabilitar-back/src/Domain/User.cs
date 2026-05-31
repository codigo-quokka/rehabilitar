using Domain.Clientes;
using Domain.Exceptions;
using Microsoft.AspNetCore.Identity;

namespace Domain;

public class User : IdentityUser<Guid>
{
    public string FirstName {get; private set;}
    public string LastName {get; private set;}
    public Dni Dni {get; private set;}
    public DateOnly FechaNacimiento { get; private set; }
    public bool SolicitoReactivacion { get; private set; }

    // constructor vacío para EF Core.
    #nullable disable
    private User() { }
    #nullable enable

    private User(string firstName, string lastName, string email, Dni dni, DateOnly fechaNacimiento, string? phoneNumber = null)
    {
        Id = Guid.NewGuid();
        FirstName = firstName;
        LastName = lastName;
        UserName = email;
        Email = email;
        PhoneNumber = phoneNumber;
        Dni = dni;
        FechaNacimiento = fechaNacimiento;
        SolicitoReactivacion = false;
    }

    public static User Create(string firstName, string lastName, string email, string dni, DateOnly fechaNacimiento, string? phoneNumber = null)
    {
        ValidarMayorDeEdad(fechaNacimiento);
        Dni dniObj = new Dni(dni);
        return new User(firstName, lastName, email, dniObj, fechaNacimiento, phoneNumber);
    }

    public void UpdateInfo(string firstName, string lastName, string? phoneNumber = null)
    {
        FirstName = firstName;
        LastName = lastName;
        PhoneNumber = phoneNumber;
    }

    public void Suspender()
    {
        LockoutEnabled = true;
        LockoutEnd = DateTimeOffset.MaxValue;
    }

    public void Reactivar()
    {
        LockoutEnabled = false;
        LockoutEnd = null;
        if (SolicitoReactivacion)
        {
            SolicitoReactivacion = false;
        }
    }

    public void SolicitarReactivacion()
    {
        SolicitoReactivacion = true;
    }

    private static void ValidarMayorDeEdad(DateOnly fechaNac)
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        if (fechaNac.AddYears(18) > hoy)
        {
            throw new DomainException("Debe ser mayor de edad para registrarse en el sitio.");
        }
    }
}
