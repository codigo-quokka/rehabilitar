using Application.Actividades;
using Application.Actividades.DTOs;
using Domain.Actividades;
using Domain.Profesores;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActividadesController : ApiControllerBase
{
    private readonly IActividadService _actividadService;

    public ActividadesController(IActividadService actividadService)
    {
        _actividadService = actividadService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] TipoEspecialidad? tipo,
        [FromQuery] FrecuenciaActividad? frecuencia,
        [FromQuery] EstadoActividad? estado,
        CancellationToken ct)
    {
        var result = await _actividadService.ListarActividades(tipo, frecuencia, estado, ct);
        return result.Match(
            actividades => Ok(actividades),
            errores => Problem(errores)
        );
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CrearActividadRequest request, CancellationToken ct)
    {
        var result = await _actividadService.CrearActividad(request, ct);
        return result.Match(
            actividad => CreatedAtAction(nameof(GetById), new { id = actividad.Id }, actividad),
            errores => Problem(errores)
        );
    }

    [HttpPost("recurrente")]
    public async Task<IActionResult> CreateRecurrent([FromBody] CrearActividadRecurrenteRequest request, CancellationToken ct)
    {
        var result = await _actividadService.CrearActividadRecurrente(request, ct);
        return result.Match(
            actividad => CreatedAtAction(nameof(GetById), new { id = actividad.Id }, actividad),
            errores => Problem(errores)
        );
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _actividadService.ObtenerActividadPorId(id, ct);
        return result.Match(
            actividad => Ok(actividad),
            errores => Problem(errores)
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] EditarActividadRequest request, CancellationToken ct)
    {
        var result = await _actividadService.EditarActividad(id, request, ct);
        return result.Match(
            actividad => Ok(actividad),
            errores => Problem(errores)
        );
    }

    [HttpPut("serie/{serieId:guid}")]
    public async Task<IActionResult> UpdateSerie(Guid serieId, [FromBody] EditarActividadRecurrenteRequest request, CancellationToken ct)
    {
        if (serieId != request.SerieId)
            return BadRequest("El ID de la serie en la URL no coincide con el del cuerpo de la solicitud.");

        var result = await _actividadService.ModificarActividadRecurrente(request, ct);
        return result.Match(
            actividad => Ok(actividad),
            errores => Problem(errores)
        );
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await _actividadService.EliminarActividad(id, ct);
        return result.Match(
            _ => NoContent(),
            errores => Problem(errores)
        );
    }
}
