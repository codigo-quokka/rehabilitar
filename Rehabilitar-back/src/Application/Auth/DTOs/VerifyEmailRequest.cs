namespace Application.Auth.DTOs;

public class VerifyEmailRequest
{
    public string UserId {get; private set;}
    public string Token {get; private set;}

    public VerifyEmailRequest(string userId, string token)
    {
        UserId = userId;
        Token = token;
    }
}