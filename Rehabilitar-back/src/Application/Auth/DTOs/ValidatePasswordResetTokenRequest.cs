namespace Application.Auth.DTOs;

public record ValidatePasswordResetTokenRequest(string UserId, string PasswordResetToken);