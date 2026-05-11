using Application.Auth;
using Application.Auth.DTOs;
using Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

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
        catch (Exception) // si es un error posta no decimos nada :P
        {
            return BadRequest(new { Error = "Ocurrió un error inesperado. Intente de nuevo."});
        }
    }

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

    [HttpPost("resend-verification-email")]
    public async Task<IActionResult> ResendVerificationEmail([FromBody]ResendVerificationEmailRequest request)
    {
        var result = await _authService.ResendVerificationEmailAsync(request);
        if (result)
            return Ok(new { Message = "Correo de verificación reenviado exitosamente." });

        return BadRequest(new { Error = "Usuario no existente o ya verificado."});
    }
}