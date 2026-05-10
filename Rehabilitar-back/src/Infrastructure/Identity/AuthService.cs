using Application.Auth;
using Application.Auth.DTOs;
using Domain;
using Domain.Clientes;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Domain.Exceptions;
using Infrastructure.Persistence;

namespace Infrastructure.Identity;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _config;
    private readonly RehabilitarDbContext _dbContext;

    public AuthService(UserManager<User> userManager, IConfiguration configuration, RehabilitarDbContext dbContext)
    {
        _userManager = userManager;
        _config = configuration;
        _dbContext = dbContext;
    }

    public async Task RegisterAsync(RegisterRequest request)
    {
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

        var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);

        await EnviarEmailDeVerificacion(user.Id, confirmationToken);
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

        var token = GenerateJwtToken(user);

        // Obtener rol del usuario
        var roles = await _userManager.GetRolesAsync(user);
        var rol = roles.FirstOrDefault() ?? "guest";

        // Crear objeto UserResponse con los datos del usuario
        var userResponse = new UserResponse
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            Nombre = user.FirstName,
            Apellido = user.LastName,
            Rol = rol,
            Activo = user.EmailConfirmed,
            FechaAlta = DateTime.UtcNow
        };

        return new AuthResponse(token, userResponse);
    }


    public async Task<bool> ResendVerificationEmailAsync(ResendVerificationEmailRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || user.EmailConfirmed)
            return false;

        var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);

        // TO-DO: IEmailService para enviar el correo, lo siguiente es una simulación.
        await EnviarEmailDeVerificacion(user.Id, confirmationToken);
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

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"] ?? throw new Exception("JWT Secret not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task EnviarEmailDeVerificacion(Guid userId, string confirmationToken)
    {
        // user id y token para scalar:
        System.Console.WriteLine($"userId = {userId}");
        System.Console.WriteLine($"confirmationToken = {confirmationToken}");
        // TO-DO: IEmailService para enviar el correo y retornar el confirmationToken.
        // Para testear mientras no esté la verificación de email se imprime el link en consola.
        System.Console.WriteLine();
        System.Console.WriteLine("Enlace de verificación: ");
        System.Console.WriteLine();
        System.Console.WriteLine($"http://localhost:5173/email-verification?userId={userId}&confirmationToken={Uri.EscapeDataString(confirmationToken)}");
    }

    private async Task CreateClient(Guid userId, DateOnly fechaNac, string dni, string? telefono = null)
    {
        var dniObj = new Dni(dni); // crear el value object (dni validado). 
        var c = Cliente.Create(userId, fechaNac, dniObj, telefono); // se manda a la factory.
        _dbContext.Clientes.Add(c); // se guarda el cliente en la tabla de clientes.
        await _dbContext.SaveChangesAsync(); // se persisten los cambios.
    }
}