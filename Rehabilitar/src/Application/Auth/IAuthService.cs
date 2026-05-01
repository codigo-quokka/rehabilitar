using Application.Auth.DTOs;

namespace Application.Auth;

public interface IAuthService
{
    Task RegisterAsync(RegisterRequest request);

    Task<AuthResponse> LoginAsync(LoginRequest request);

    Task<bool> VerifyEmailAsync(VerifyEmailRequest request);

    Task<bool> ResendVerificationEmailAsync(ResendVerificationEmailRequest email);
}