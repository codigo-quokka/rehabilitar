using Application.Auth.DTOs;
using ErrorOr;

namespace Application.Auth;

public interface IAuthService
{
    Task<ErrorOr<Success>> RegisterAsync(RegisterRequest request);
    Task<ErrorOr<AuthResponse>> LoginAsync(LoginRequest request);
    Task<ErrorOr<Success>> VerifyEmailAsync(VerifyEmailRequest request);
    Task<ErrorOr<Success>> ResendVerificationEmailAsync(EmailRequest email);
    Task<ErrorOr<Success>> SendResetPasswordEmailAsync(EmailRequest email);
    Task<ErrorOr<Success>> ResetPasswordAsync(ResetPasswordRequest request);
    Task<ErrorOr<Success>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<ErrorOr<Success>> ValidatePasswordResetTokenAsync(ValidatePasswordResetTokenRequest request);
}
