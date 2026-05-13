using Application.Auth;
using Application.Auth.DTOs;
using Application.Common.Interfaces;
using Domain;
using Domain.Clientes;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Domain.Exceptions;
using Infrastructure.Persistence;

namespace Infrastructure.Identity;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly RehabilitarDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly JwtService _jwt;

    public AuthService(UserManager<User> userManager,
                        RehabilitarDbContext dbContext,
                        IEmailService emailService,
                        JwtService jwt)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _emailService = emailService;
        _jwt = jwt;
    }

    public async Task RegisterAsync(RegisterRequest request)

    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        
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

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Error al registrar usuario: {errors}");
            }

            // Asignar rol de cliente registrado por defecto
            await _userManager.AddToRoleAsync(user, "registered_client");

            await CreateClient(user.Id, request.FechaNacimiento, request.Dni, request.Telefono);

            await EnviarEmailDeVerificacion(user);

            await transaction.CommitAsync();
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
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

        var token = _jwt.GenerateJwtToken(user);

        // Obtener rol del usuario
        var roles = await _userManager.GetRolesAsync(user);
        var rol = roles.FirstOrDefault() ?? "guest";

        // Datos extra del Cliente (DNI, fecha nac., teléfono) viven en otra tabla.
        var cliente = await _dbContext.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == user.Id);

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


    public async Task<bool> ResendVerificationEmailAsync(ResendVerificationEmailRequest request)
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

    // métodos privados para funcionalidades específicas:

    private async Task CreateClient(Guid userId, DateOnly fechaNac, string dni, string? telefono = null)
    {
        var dniObj = new Dni(dni); // crear el value object (dni validado). 
        var c = Cliente.Create(userId, fechaNac, dniObj, telefono); // se manda a la factory.
        _dbContext.Clientes.Add(c); // se guarda el cliente en la tabla de clientes.
        await _dbContext.SaveChangesAsync(); // se persisten los cambios.
    }

    private async Task EnviarEmailDeVerificacion(User user)
    {
        var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        string verificationLink =
            $"http://localhost:5173/email-verification?userId={user.Id}&confirmationToken={Uri.EscapeDataString(confirmationToken)}";
        var emailResult = await _emailService.SendConfirmationEmail(user.Email!, verificationLink);
        if (emailResult.IsError)
            throw new Exception("El usuario no pudo ser creado porque falló el correo de verificación.");
    }
}