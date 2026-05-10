namespace Application.Auth.DTOs;

public class AuthResponse
{
    public string Token { get; private set; }
    public UserResponse? User { get; private set; }

    public AuthResponse(string token, UserResponse? user = null)
    {
        Token = token;
        User = user;
    }
}