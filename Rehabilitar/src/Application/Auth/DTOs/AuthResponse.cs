namespace Application.Auth.DTOs;

public class AuthResponse
{
    public string Token { get; private set; }

    public AuthResponse(string token)
    {
        Token = token;
    }
}