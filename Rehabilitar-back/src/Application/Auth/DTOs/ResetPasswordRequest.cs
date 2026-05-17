namespace Application.Auth.DTOs;

public record class ResetPasswordRequest(string UserId, string PasswordResetToken, string NewPassword);