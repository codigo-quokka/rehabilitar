using Application.Suscripciones;
using Application.Suscripciones.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Route("api/[controller]")]
public class SuscripcionesController : ApiControllerBase
{
    private readonly ISuscripcionService _suscripcionService;

    public SuscripcionesController(ISuscripcionService suscripcionService)
    {
        _suscripcionService = suscripcionService;
    }

    [HttpPost]
    public async Task<IActionResult> Suscribir([FromBody] CrearSuscripcionRequest request)
    {
        var result = await _suscripcionService.SuscribirAsync(request.ClienteId, request.SerieId);
        return result.Match(
            suscripcion => Ok(suscripcion),
            errores => Problem(errores)
        );
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        var result = await _suscripcionService.CancelarSuscripcionAsync(id);
        return result.Match(
            _ => NoContent(),
            errores => Problem(errores)
        );
    }
}
