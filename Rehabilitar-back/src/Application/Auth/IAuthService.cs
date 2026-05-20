using Application.Auth.DTOs;
using ErrorOr;

namespace Application.Auth;

public interface IAuthService
{
    Task RegisterAsync(RegisterRequest request);

    Task<AuthResponse> LoginAsync(LoginRequest request);

    Task<bool> VerifyEmailAsync(VerifyEmailRequest request);

    Task<bool> ResendVerificationEmailAsync(EmailRequest email);

    Task<ErrorOr<Success>> SendResetPasswordEmailAsync(EmailRequest email);

    Task<ErrorOr<Success>> ResetPasswordAsync(ResetPasswordRequest request);
    Task<ErrorOr<Success>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
}