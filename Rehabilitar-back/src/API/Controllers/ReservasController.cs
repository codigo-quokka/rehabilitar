using System.Security.Claims;
using Application.Reservas;
using Application.Reservas.DTOs;
using ErrorOr;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Application.Pagos.Requests;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservasController : ApiControllerBase
{
    private readonly IReservaService _reservaService;
    
    public ReservasController(IReservaService reservaService) => _reservaService = reservaService;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? usuarioId, 
        [FromQuery] Guid? actividadId, 
        CancellationToken ct)
    {
        if (usuarioId.HasValue)
        {
            var result = await _reservaService.ObtenerReservasDeClientePorId(usuarioId.Value, ct);
            return result.Match(
                reservas => Ok(reservas),
                errores => Problem(errores)
            );
        }
        
        if (actividadId.HasValue)
        {
            var result = await _reservaService.ObtenerReservasDeActividadPorId(actividadId.Value, ct);
            return result.Match(
                reservas => Ok(reservas),
                errores => Problem(errores)
            );
        }
        
        return BadRequest("Debe especificar usuarioId o actividadId en la consulta.");
    }

    [HttpGet("mis-reservas")]
    [Authorize(Roles = "Cliente Registrado")]
    public async Task<IActionResult> GetMisReservas(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var clienteId))
        {
            return Problem(new List<Error> { Error.Validation(code: "User.InvalidId", description: "ID de usuario inválido.") });
        }

        var result = await _reservaService.ObtenerReservasDeClientePorId(clienteId, ct);
        return result.Match(
            reservas => Ok(reservas),
            errores => Problem(errores)
        );
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _reservaService.ObtenerReservaPorId(id, ct);

        return result.Match(
            reserva => Ok(reserva),
            errores => Problem(errores)
        );
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ReservarActividadRequest request, CancellationToken ct)
    {
        var result = await _reservaService.ReservarActividadAsync(request, ct);

        return result.Match(
            intencionId => Ok(new { IntencionId = intencionId }),
            errores => Problem(errores)
        );
    }

    [HttpPost("recurrente")]
    public async Task<IActionResult> CreateRecurrent([FromBody] ReservaRecurrenteRequest request, CancellationToken ct)
    {
        var result = await _reservaService.ReservarActividadesRecurrentes(request, ct);

        return result.Match(
            success => Ok(new { IntencionId = success }),
            errores => Problem(errores)
        );
    }

    [HttpPost("{reservaId:guid}/pago")]
    public async Task<IActionResult> RegistrarPago(Guid reservaId, [FromBody] RegistrarPagoRequest request, CancellationToken ct)
    {
        var result = await _reservaService.ConfirmarPagoReservaAsync(request, reservaId, ct);

        return result.Match(
            success => Ok(),
            errores => Problem(errores)
        );
    }

    [HttpPut("{id:guid}/cancelar")]
    public async Task<IActionResult> Cancelar([FromQuery] Guid actividadId, Guid id, CancellationToken ct)
    {
        var result = await _reservaService.CancelarReservaAsync(actividadId, id, ct);

        return result.Match(
            _ => NoContent(),
            errores => Problem(errores)
        );
    }

    [HttpPut("serie/{serieId:guid}/cancelar")]
    [Authorize]
    public async Task<IActionResult> CancelarSerie(Guid serieId, [FromQuery] Guid? clienteId, CancellationToken ct)
    {
        // Determinamos el clienteId según el rol:
        // - Administrador/Recepción: pueden pasar cualquier clienteId
        // - Cliente Registrado: solo puede cancelar sus propias reservas
        Guid effectiveClienteId;
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        
        if (userRole == "Administrador" || userRole == "Recepción")
        {
            if (!clienteId.HasValue || clienteId.Value == Guid.Empty)
                return Problem(new List<Error> { Error.Validation("Reserva.ClienteRequerido", "Debe especificar el clienteId.") });
            effectiveClienteId = clienteId.Value;
        }
        else
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out effectiveClienteId))
                return Problem(new List<Error> { Error.Validation("User.InvalidId", "ID de usuario inválido.") });
        }

        var result = await _reservaService.CancelarSerieReservasAsync(effectiveClienteId, serieId, ct);

        return result.Match(
            _ => NoContent(),
            errores => Problem(errores)
        );
    }
}
