using System.Security.Claims;
using Application.Actividades;
using Application.Actividades.DTOs;
using Domain.Actividades;
using Domain.Profesores;
using ErrorOr;
using Microsoft.AspNetCore.Authorization;
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
        [FromQuery] Guid? profesorId,
        CancellationToken ct)
    {
        var result = await _actividadService.ListarActividades(tipo, frecuencia, estado, profesorId, ct);
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

    [HttpPut("{id:guid}/asignar-profesor")]
    public async Task<IActionResult> AsignarProfesor(Guid id, [FromBody] AsignarProfesorRequest request, CancellationToken ct)
    {
        var result = await _actividadService.AsignarProfesorActividad(id, request, ct);
        return result.Match(
            actividad => Ok(actividad),
            errores => Problem(errores)
        );
    }

    [HttpPut("{id:guid}/remover-profesor")]
    public async Task<IActionResult> RemoverProfesor(Guid id, [FromBody] RemoverProfesorRequest request, CancellationToken ct)
    {
        var result = await _actividadService.RemoverProfesorActividad(id, request, ct);
        return result.Match(
            actividad => Ok(actividad),
            errores => Problem(errores)
        );
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await _actividadService.CancelarActividad(id, ct);
        return result.Match(
            _ => NoContent(),
            errores => Problem(errores)
        );
    }

    [HttpPost("{id:guid}/iniciar")]
    public async Task<IActionResult> Iniciar(Guid id, CancellationToken ct)
    {
        var result = await _actividadService.IniciarActividadAsync(id, ct);
        return result.Match(
            _ => Ok(),
            errores => Problem(errores)
        );
    }

    [HttpPost("{id:guid}/finalizar")]
    public async Task<IActionResult> Finalizar(Guid id, CancellationToken ct)
    {
        var result = await _actividadService.FinalizarActividadAsync(id, ct);
        return result.Match(
            _ => Ok(),
            errores => Problem(errores)
        );
    }

    [HttpPost("{id:guid}/asistencia")]
    public async Task<IActionResult> RegistrarAsistencia(Guid id, [FromBody] RegistrarAsistenciaRequest request, CancellationToken ct)
    {
        var result = await _actividadService.RegistrarAsistenciaPorDniAsync(id, request.Dni, ct);
        return result.Match(
            _ => Ok(),
            errores => Problem(errores)
        );
    }

    [HttpPost("{id:guid}/asistencia/confirmar")]
    [Authorize(Roles = "Cliente Registrado")]
    public async Task<IActionResult> ConfirmarAsistencia(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var clienteId))
            return Problem(new List<Error> { Error.Validation("User.InvalidId", "ID de usuario inválido.") });
        
        var result = await _actividadService.ConfirmarAsistenciaAsync(id, clienteId, ct);
        return result.Match(_ => Ok(new { mensaje = "Asistencia registrada correctamente" }), errores => Problem(errores));
    }
}
