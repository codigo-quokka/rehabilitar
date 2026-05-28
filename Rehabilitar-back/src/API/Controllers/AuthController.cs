using Application.Auth;
using Application.Auth.DTOs;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;
    private readonly IDocumentScannerService _documentScannerService;

    public AuthController(IAuthService authService, IDocumentScannerService documentScannerService)
    {
        _authService = authService;
        _documentScannerService = documentScannerService;
    }

    [AllowAnonymous]
    [HttpPost("scan-dni")]
    public async Task<IActionResult> ScanDni(IFormFile frontImage)
    {
        if (frontImage == null || frontImage.Length == 0)
            return BadRequest(new { Error = "Por favor provea una imagen válida." });

        var validExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(frontImage.FileName).ToLowerInvariant();
        if (!validExtensions.Contains(ext))
            return BadRequest(new { Error = "Formato de imagen no soportado." });

        using var stream = frontImage.OpenReadStream();
        var result = await _documentScannerService.ScanDniAsync(stream);
        
        if (result.IsValidId)
            return Ok(result);
            
        return BadRequest(new { Error = result.ErrorMessage ?? "No se pudo leer el DNI." });
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody]RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return result.Match(
            _ => Ok(new { Message = "Usuario registrado exitosamente." }),
            errors => Problem(errors)
        );
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody]LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return result.Match(
            response => Ok(response),
            errors => Problem(errors)
        );
    }

    [AllowAnonymous]
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody]VerifyEmailRequest request)
    {
        var result = await _authService.VerifyEmailAsync(request);
        return result.Match(
            _ => Ok(new { Message = "Correo verificado exitosamente." }),
            errors => Problem(errors)
        );
    }

    [AllowAnonymous]
    [HttpPost("resend-verification-email")]
    public async Task<IActionResult> ResendVerificationEmail([FromBody]EmailRequest request)
    {
        var result = await _authService.ResendVerificationEmailAsync(request);
        return result.Match(
            _ => Ok(new { Message = "Correo de verificación reenviado exitosamente." }),
            errors => Problem(errors)
        );
    }

    [AllowAnonymous]
    [HttpPost("recover")]
    public async Task<IActionResult> SendResetPasswordEmail([FromBody]EmailRequest request)
    {
        var result = await _authService.SendResetPasswordEmailAsync(request);

        return result.Match(
            _ => Ok(),
            errors => Problem(errors)
        );
    }

    [AllowAnonymous]
    [HttpPost("reset")]
    public async Task<IActionResult> ResetPassword([FromBody]ResetPasswordRequest request)
    {
        var result = await _authService.ResetPasswordAsync(request);

        return result.Match(
            _ => Ok(),
            errors => Problem(errors)
        );

    }

    [AllowAnonymous]
    [HttpPost("validate-reset-token")]
    public async Task<IActionResult> ValidatePasswordResetToken([FromBody]ValidatePasswordResetTokenRequest request)
    {
        var result = await _authService.ValidatePasswordResetTokenAsync(request);

        return result.Match(
            _ => Ok(),
            errors => Problem(errors)
        );

    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { Error = "Usuario no autenticado." });

        var result = await _authService.ChangePasswordAsync(userId, request);
        return result.Match(
            _ => Ok(new { Message = "Contraseña actualizada exitosamente." }),
            errors => Problem(errors)
        );
    }
}
