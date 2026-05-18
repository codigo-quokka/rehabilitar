using Application.Reservas;
using Application.Reservas.DTOs;
using Microsoft.AspNetCore.Mvc;
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
            reserva => CreatedAtAction(nameof(GetAll), new { usuarioId = reserva.ClienteId }, reserva),
            errores => Problem(errores)
        );
    }

    [HttpPost("recurrente")]
    public async Task<IActionResult> CreateRecurrent([FromBody] ReservaRecurrenteRequest request, CancellationToken ct)
    {
        var result = await _reservaService.ReservarActividadesRecurrentes(request, ct);

        return result.Match(
            success => Ok(),
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancelar([FromQuery] Guid actividadId, Guid id, CancellationToken ct)
    {
        var result = await _reservaService.CancelarReservaAsync(actividadId, id, ct);

        return result.Match(
            _ => NoContent(),
            errores => Problem(errores)
        );
    }
}
