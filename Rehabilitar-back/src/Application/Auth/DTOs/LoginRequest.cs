namespace Application.Auth.DTOs;

public record class LoginRequest(string Email, string Password)
{
    // los record al imprimirse tiran un ToString() con todos los campos.
    // de esta manera se protege la contraseña para que no quede guardada en algún log en plaintext.
    public sealed override string ToString()
    {
        return $"LoginRequest {{ Email = {Email}, Password = ***** }}";
    }
}
/* equivalente a:

public class LoginRequest
{
    public string Email {get; init;}
    public string Password {get; init;}

    public LoginRequest(string email, string password)
    {
        Email = email;
        Password = password;
    }
}

*/