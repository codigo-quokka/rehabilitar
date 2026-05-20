using Application.Auth;
using Application.Auth.DTOs;
using Application.Common.Interfaces;
using Domain.Exceptions;
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
        try
        {
            await _authService.RegisterAsync(request);
            return Ok(new { Message = "Usuario registrado exitosamente."});
        }
        catch (DomainException e) // si es del dominio mostramos el error.
        {
            return BadRequest(new { Error = e.Message});
        }
        catch (Exception e) // si es un error posta no decimos nada :P (pero por ahora sí para debugear)
        {
            // return BadRequest(new { Error = "Ocurrió un error inesperado. Intente de nuevo."});
            return BadRequest(new { Error = e.Message});
        }
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody]LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (EmailNotVerifiedException e)
        {
            return Unauthorized(new
            {
               ErrorCode = "EMAIL_NOT_VERIFIED",
               Message = e.Message 
            });
        }
        catch (Exception e)
        {
            return Unauthorized(new { Error = e.Message});
        }
    }

    [AllowAnonymous]
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody]VerifyEmailRequest request)
    {
        try
        {
            var result = await _authService.VerifyEmailAsync(request);
            if (result)
                return Ok(new { Message = "Correo verificado exitosamente."});

            // 400 BadRequest. Para peticiones incorrectas, p. ej. un JSON mal cerrado o que le falta algún campo requerido.
            return BadRequest(new { Error = "El enlace expiró o es incorrecto."});
        }
        // 409 Conflict. Para peticiones correctas, pero que rompen reglas de negocio.
        catch (EmailAlreadyVerifiedException e)
        {
            return Conflict(new {
                ErrorCode = "EMAIL_ALREADY_VERIFIED",
                Message = e.Message
            });
        }
        // 404 Not Found.
        // Acá se podría devolver un BadRequest genérico como el de arriba para no exponer cuáles guids de usuarios existen y cuáles no.
        // De momento lo dejo así para debuggear y demás.
        catch (UserNotFoundException)
        {
            return NotFound(new
            {
                ErrorCode = "USER_NOT_FOUND",
                Error = "El enlace expiró o es incorrecto."
            });
        }
        // 500 Error interno (para excepciones no controladas).
        catch (Exception e)
        {
            return StatusCode(500, new { Error = e.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("resend-verification-email")]
    public async Task<IActionResult> ResendVerificationEmail([FromBody]EmailRequest request)
    {
        var result = await _authService.ResendVerificationEmailAsync(request);
        if (result)
            return Ok(new { Message = "Correo de verificación reenviado exitosamente." });

        return BadRequest(new { Error = "Usuario no existente o ya verificado."});
    }

    [AllowAnonymous]
    [HttpPost("recover")]
    public async Task<IActionResult> SendResetPasswordEmail([FromBody]EmailRequest request)
    {
        var result = await _authService.SendResetPasswordEmailAsync(request);

        return result.Match(
            Success => Ok(),
            errors => Problem(errors)
        );
    }

    [AllowAnonymous]
    [HttpPost("reset")]
    public async Task<IActionResult> ResetPassword([FromBody]ResetPasswordRequest request)
    {
        var result = await _authService.ResetPasswordAsync(request);
        // if (result)
        //     return Ok(new { Message = "Correo de verificación reenviado exitosamente." });

        // return BadRequest(new { Error = "Usuario no existente o ya verificado." });

        return result.Match(
            Success => Ok(),
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