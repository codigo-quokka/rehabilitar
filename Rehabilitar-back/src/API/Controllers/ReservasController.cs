using Application.Reservas;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservasController : ApiControllerBase
{
    private readonly ReservaService _reservaService;
    
    public ReservasController(ReservaService reservaService) => _reservaService = reservaService;

    [HttpGet]
    public async Task<IActionResult> GetMisReservas(Guid userId, CancellationToken ct)
    {
        var result = await _reservaService.ObtenerReservasDeClientePorId(userId, ct);
        return result.Match(
            reservas => Ok(reservas),
            errores => Problem(errores)
        );
    }

    public async Task <IActionResult> CrearReserva(Guid userId, CancellationToken ct)
    {
        var result = await _reservaService.ReservarActividadAsync(userId, ct);

        return result.Match(
            reservas => Ok(reservas),
            errores => Problem(errores)
        );
    }
}
