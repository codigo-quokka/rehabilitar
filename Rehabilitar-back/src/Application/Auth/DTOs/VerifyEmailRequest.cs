namespace Application.Auth.DTOs;

public class VerifyEmailRequest
{
    public string UserId {get; private set;}
    public string ConfirmationToken {get; private set;}

    public VerifyEmailRequest(string userId, string confirmationToken)
    {
        UserId = userId;
        ConfirmationToken = confirmationToken;
    }
}