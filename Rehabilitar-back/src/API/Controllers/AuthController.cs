using Application.Auth;
using Application.Auth.DTOs;
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
        catch (Exception e)
        {
            return BadRequest(new { Error = e.Message});
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
        catch (Exception e)
        {
            return Unauthorized(new { Error = e.Message});
        }
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody]VerifyEmailRequest request)
    {
            var result = await _authService.VerifyEmailAsync(request);
            if (result)
                return Ok(new { Message = "Correo verificado exitosamente."});

            return BadRequest(new { Error = "Token inválido o expirado."});
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