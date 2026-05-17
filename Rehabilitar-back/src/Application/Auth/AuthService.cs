using Application.Auth.DTOs;
using Application.Common.Interfaces;
using Domain;
using Domain.Clientes;
using Microsoft.AspNetCore.Identity;
using Domain.Exceptions;
using Application.Clientes;
using ErrorOr;

namespace Application.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager; // esto sería como repo de users
    private readonly IUnitOfWork _uow; // uow lo traigo para hacer lo que hacía dbcontext
    private readonly IClienteRepository _clienteRepo;
    private readonly IEmailService _emailService;
    private readonly IJwtProvider _jwt;

    private const string Dominio = "localhost:5173";

    public AuthService(UserManager<User> userManager,
                        IClienteRepository clienteRepo,
                        IUnitOfWork uow,
                        IEmailService emailService,
                        IJwtProvider jwt)
    {
        _userManager = userManager;
        _clienteRepo = clienteRepo;
        _uow = uow;
        _emailService = emailService;
        _jwt = jwt;
    }

    public async Task RegisterAsync(RegisterRequest request)

    {
        await _uow.BeginTransactionAsync();
        
        try {
            var user = User.Create(
                request.FirstName,
                request.LastName,
                // request.FechaNacimiento,
                request.Email
                // request.Dni,
                // request.Telefono
            );

            var result = await _userManager.CreateAsync(user, request.Password);
            Cliente c = CrearCliente(user.Id, request.FechaNacimiento, request.Dni, request.Telefono);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Error al registrar usuario: {errors}");
            }

            // Asignar rol de cliente registrado por defecto
            await _userManager.AddToRoleAsync(user, "registered_client");

            _clienteRepo.Add(c);
            await EnviarEmailDeVerificacion(user);

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();
        }
        catch (Exception)
        {
            await _uow.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            throw new Exception("Credenciales incorrectas.");

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
            throw new Exception("Credenciales incorrectas.");

        if (!user.EmailConfirmed)
            throw new EmailNotVerifiedException("Email no confirmado.");

        if (await _userManager.IsLockedOutAsync(user))
            throw new DomainException("Usuario suspendido.");

        var token = _jwt.GenerateJwtToken(user);

        // Obtener rol del usuario
        var roles = await _userManager.GetRolesAsync(user);
        var rol = roles.FirstOrDefault() ?? "guest";

        // Datos extra del Cliente (DNI, fecha nac., teléfono) viven en otra tabla.
        var cliente = await _clienteRepo.GetByIdAsync(user.Id);
            // .AsNoTracking()
            // .FirstOrDefaultAsync(c => c.UserId == user.Id);

        // Crear objeto UserResponse con los datos del usuario
        var userResponse = new UserResponse
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            Nombre = user.FirstName,
            Apellido = user.LastName,
            Rol = rol,
            Activo = user.EmailConfirmed,
            FechaAlta = DateTime.UtcNow,
            Telefono = cliente?.Telefono,
            FechaNacimiento = cliente?.FechaNacimiento.ToString("yyyy-MM-dd"),
            Documento = cliente?.Dni.Valor
        };

        return new AuthResponse(token, userResponse);
    }


    public async Task<bool> ResendVerificationEmailAsync(EmailRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || user.EmailConfirmed)
            return false;

        await EnviarEmailDeVerificacion(user);

        return true;
    }

    public async Task<bool> VerifyEmailAsync(VerifyEmailRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
            throw new UserNotFoundException($"No se encontró al usuario con id {request.UserId}.");

        if (user.EmailConfirmed)
            throw new EmailAlreadyVerifiedException("El email del usuario ya se encuentra verificado.");

        var result = await _userManager.ConfirmEmailAsync(user, request.ConfirmationToken);
        return result.Succeeded;
    }

    public async Task<ErrorOr<Success>> SendResetPasswordEmailAsync(EmailRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return Error.NotFound("Usuario no encontrado.");
        
        var result = await EnviarEmailDeResetPassword(user);
        return result;
    }

    public async Task<ErrorOr<Success>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
            return Error.NotFound("Usuario no encontrado.");

        if (await _userManager.CheckPasswordAsync(user, request.NewPassword))
            return Error.Validation("Password.SameAsOld", "La nueva contraseña no puede ser idéntica a la actual.");

        var result = await _userManager.ResetPasswordAsync(user, request.PasswordResetToken, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => Error.Validation(e.Code, e.Description)).ToList();
            return errors;
        }
        return Result.Success;
    }

    // métodos privados para funcionalidades específicas:

    private Cliente CrearCliente(Guid userId, DateOnly fechaNac, string dni, string? telefono = null)
    {
        var dniObj = new Dni(dni); // crear el value object (dni validado). 
        var c = Cliente.Create(userId, fechaNac, dniObj, telefono); // se manda a la factory.
        return c;
    }

    private async Task EnviarEmailDeVerificacion(User user)
    {
        var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        string verificationLink =
            $"http://{Dominio}/email-verification?userId={user.Id}&confirmationToken={Uri.EscapeDataString(confirmationToken)}";
        var emailResult = await _emailService.SendConfirmationEmail(user.Email!, verificationLink);
        if (emailResult.IsError)
            throw new Exception("El usuario no pudo ser creado porque falló el envío del correo de verificación.");
    }

    private async Task<ErrorOr<Success>> EnviarEmailDeResetPassword(User user)
    {
        var passwordResetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        string link =
            $"http://{Dominio}/reset-password?userId={user.Id}&passwordResetToken={Uri.EscapeDataString(passwordResetToken)}";
        var emailResult = await _emailService.SendPasswordResetEmail(user.Email!, link);

        return emailResult;
    }
}