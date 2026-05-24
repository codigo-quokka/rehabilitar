using Application.Auth.DTOs;
using Application.Common.Interfaces;
using Application.Clientes;
using Domain;
using Domain.Clientes;
using Microsoft.AspNetCore.Identity;
using ErrorOr;
using Application.Common.Settings;

namespace Application.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly IUnitOfWork _uow;
    private readonly IClienteRepository _clienteRepo;
    private readonly IEmailService _emailService;
    private readonly IJwtProvider _jwt;
    private readonly FrontendSettings _frontendSettings;

    public AuthService(UserManager<User> userManager,
                        IClienteRepository clienteRepo,
                        IUnitOfWork uow,
                        IEmailService emailService,
                        IJwtProvider jwt,
                        FrontendSettings frontendSettings)
    {
        _userManager = userManager;
        _clienteRepo = clienteRepo;
        _uow = uow;
        _emailService = emailService;
        _jwt = jwt;
        _frontendSettings = frontendSettings;
    }

    public async Task<ErrorOr<Success>> RegisterAsync(RegisterRequest request)
    {
        await _uow.BeginTransactionAsync();

        try {
            var user = User.Create(
                request.FirstName,
                request.LastName,
                request.Email
            );

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                await _uow.RollbackTransactionAsync();
                return result.Errors
                    .Select(e => Error.Validation($"Identity.{e.Code}", e.Description))
                    .ToList();
            }

            // Asignar rol de cliente registrado por defecto
            await _userManager.AddToRoleAsync(user, "Cliente Registrado");

            Cliente c = CrearCliente(user.Id, request.FechaNacimiento, request.Dni, request.Telefono);
            _clienteRepo.Add(c);

            var emailResult = await EnviarEmailDeVerificacion(user);
            if (emailResult.IsError)
            {
                await _uow.RollbackTransactionAsync();
                return Error.Unexpected("Email.SendFailed", "No se pudo enviar el correo de verificación.");
            }

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            return Result.Success;
        }
        catch (Exception)
        {
            await _uow.RollbackTransactionAsync();
            return Error.Failure("Auth.UnexpectedError", "Ocurrió un error inesperado durante el registro.");
        }
    }

    public async Task<ErrorOr<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return Error.Unauthorized("Auth.InvalidCredentials", "Credenciales incorrectas.");

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
            return Error.Unauthorized("Auth.InvalidCredentials", "Credenciales incorrectas.");

        if (!user.EmailConfirmed)
            return Error.Forbidden(code: "Email.NotVerified", description: "Email no confirmado.");

        if (await _userManager.IsLockedOutAsync(user))
            return Error.Forbidden("User.Suspended", "Usuario suspendido.");

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwt.GenerateJwtToken(user, roles);

        var rol = roles.FirstOrDefault() ?? "Cliente Registrado";

        var cliente = await _clienteRepo.GetByIdAsync(user.Id);

        var userResponse = new UserResponse
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            Nombre = user.FirstName,
            Apellido = user.LastName,
            Rol = rol,
            Activo = user.EmailConfirmed,
            Telefono = cliente?.Telefono,
            FechaNacimiento = cliente?.FechaNacimiento.ToString("yyyy-MM-dd"),
            Documento = cliente?.Dni.Valor
        };

        return new AuthResponse(token, userResponse);
    }

    public async Task<ErrorOr<Success>> VerifyEmailAsync(VerifyEmailRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
            return Error.NotFound("User.NotFound", "No se encontró al usuario.");

        if (user.EmailConfirmed)
            return Error.Conflict("Email.AlreadyVerified", "El email del usuario ya se encuentra verificado.");

        var result = await _userManager.ConfirmEmailAsync(user, request.ConfirmationToken);
        if (!result.Succeeded)
            return Error.Validation("Token.InvalidVerification", "El token de confirmación no es válido.");

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ResendVerificationEmailAsync(EmailRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return Error.NotFound("User.NotFound", "Usuario no encontrado.");

        if (user.EmailConfirmed)
            return Error.Conflict("Email.AlreadyVerified", "El email ya se encuentra verificado.");

        var result = await EnviarEmailDeVerificacion(user);
        if (result.IsError)
            return Error.Unexpected("Email.SendFailed", "No se pudo reenviar el correo de verificación.");

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> SendResetPasswordEmailAsync(EmailRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return Error.NotFound("User.NotFound", "Usuario no encontrado.");

        var result = await EnviarEmailDeResetPassword(user);
        return result;
    }

    public async Task<ErrorOr<Success>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
            return Error.NotFound("User.NotFound", "Usuario no encontrado.");

        if (await _userManager.CheckPasswordAsync(user, request.NewPassword))
            return Error.Validation("Password.SameAsOld", "La nueva contraseña no puede ser idéntica a la actual.");

        var result = await _userManager.ResetPasswordAsync(user, request.PasswordResetToken, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => Error.Validation($"Identity.{e.Code}", e.Description)).ToList();
            return errors;
        }
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Error.NotFound("User.NotFound", "Usuario no encontrado.");

        if (request.NewPassword != request.ConfirmNewPassword)
            return Error.Validation("Passwords.NoMatch", "La nueva contraseña y la confirmación no coinciden.");

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => Error.Validation($"Identity.{e.Code}", e.Description)).ToList();
            return errors;
        }
        return Result.Success;
    }

    private Cliente CrearCliente(Guid userId, DateOnly fechaNac, string dni, string? telefono = null)
    {
        var dniObj = new Dni(dni);
        var c = Cliente.Create(userId, fechaNac, dniObj, telefono);
        return c;
    }

    private async Task<ErrorOr<Success>> EnviarEmailDeVerificacion(User user)
    {
        var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        string verificationLink =
            $"{_frontendSettings.BaseUrl}/email-verification?userId={user.Id}&confirmationToken={Uri.EscapeDataString(confirmationToken)}";
        var emailResult = await _emailService.SendConfirmationEmail(user.Email!, verificationLink);
        return emailResult;
    }

    private async Task<ErrorOr<Success>> EnviarEmailDeResetPassword(User user)
    {
        var passwordResetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        string link =
            $"{_frontendSettings.BaseUrl}/reset-password?userId={user.Id}&passwordResetToken={Uri.EscapeDataString(passwordResetToken)}";
        var emailResult = await _emailService.SendPasswordResetEmail(user.Email!, link);
        return emailResult;
    }
}
