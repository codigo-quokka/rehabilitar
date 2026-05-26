using Application.AptosFisicos;
using API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ErrorOr;

namespace API.Controllers;

[Route("api/aptos-fisicos")]
[Authorize]
public class AptosFisicosController : ApiControllerBase
{
    private readonly IAptoFisicoService _aptoFisicoService;

    public AptosFisicosController(IAptoFisicoService aptoFisicoService)
    {
        _aptoFisicoService = aptoFisicoService;
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Cliente Registrado")]
    public async Task<IActionResult> UploadAptoFisico(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return Problem(new List<Error> { Error.Validation(code: "File.Empty", description: "El archivo no puede estar vacío.") });
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var clienteId))
        {
            return Problem(new List<Error> { Error.Validation(code: "User.InvalidId", description: "ID de usuario inválido.") });
        }

        var result = await _aptoFisicoService.SubirAsync(clienteId, file.OpenReadStream(), file.FileName, file.ContentType);

        return result.Match(
            apto => Ok(apto),
            errores => Problem(errores)
        );
    }

    [HttpGet("mi-apto")]
    [Authorize(Roles = "Cliente Registrado")]
    public async Task<IActionResult> GetMisAptos()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var clienteId))
        {
            return Problem(new List<Error> { Error.Validation(code: "User.InvalidId", description: "ID de usuario inválido.") });
        }

        var result = await _aptoFisicoService.GetMiAptoAsync(clienteId);

        return result.Match(
            apto => Ok(apto),
            errores => Problem(errores)
        );
    }

    [HttpGet]
    [Authorize(Roles = "Administrador, Recepción")]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _aptoFisicoService.GetAll(ct);

        return result.Match(
            aptos => Ok(aptos),
            errores => Problem(errores)
        );
    }

    [HttpGet("pendientes")]
    [Authorize(Roles = "Administrador, Recepción")]
    public async Task<IActionResult> GetPendientes()
    {
        var result = await _aptoFisicoService.GetPendientesAsync();

        return result.Match(
            aptos => Ok(aptos),
            errores => Problem(errores)
        );
    }

    [HttpGet]
    [Authorize(Roles = "Administrador, Recepción")]
    public async Task<IActionResult> GetAll()
    {
        var result = await _aptoFisicoService.GetAllAsync();
        return result.Match(
            aptos => Ok(aptos),
            errores => Problem(errores)
        );
    }

    [HttpGet("{id}/archivo")]
    [Authorize(Roles = "Cliente Registrado, Administrador, Recepción")]
    public async Task<IActionResult> GetArchivo(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var rol = User.FindFirstValue(ClaimTypes.Role);

        if (!Guid.TryParse(userId, out var usuarioId))
        {
            return Problem(new List<Error> { Error.Validation(code: "User.InvalidId", description: "ID de usuario inválido.") });
        }

        var result = await _aptoFisicoService.GetArchivoAsync(id, usuarioId, rol);

        return result.Match(
            dto =>
            {
                return File(dto.Archivo, dto.ContentType, dto.NombreArchivo);
            },
            errores => Problem(errores)
        );
    }

    public record EvaluarAptoFisicoRequest(bool Aprobado, string? MotivoRechazo);

    [HttpPut("{id}/evaluar")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> EvaluarAptoFisico(Guid id, EvaluarAptoFisicoRequest request)
    {
        var evaluadoPorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(evaluadoPorId, out var evaluadoPor))
        {
            return Problem(new List<Error> { Error.Validation(code: "User.InvalidId", description: "ID de usuario inválido.") });
        }

        var result = await _aptoFisicoService.EvaluarAsync(id, evaluadoPor, request.Aprobado, request.MotivoRechazo);

        return result.Match(
            _ => Ok(new { mensaje = "Apto físico evaluado correctamente" }),
            errores => Problem(errores)
        );
    }
}
