namespace Application.Auth.DTOs;

public class RegisterRequest
{
    public string FirstName {get; private set;}
    public string LastName {get; private set;}
    public string Password {get; private set;}
    public string Email {get; private set;}
    public string Dni {get; private set;}
    public DateOnly FechaNacimiento {get; private set;}
    public string? Telefono {get; private set;}

    public RegisterRequest(string firstName, string lastName, string password, string email, string dni, DateOnly fechaNacimiento, string? telefono = null)
    {
        FirstName = firstName;
        LastName = lastName;
        Password = password;
        Email = email;
        Dni = dni;
        FechaNacimiento = fechaNacimiento;
        Telefono = telefono;
    }

}