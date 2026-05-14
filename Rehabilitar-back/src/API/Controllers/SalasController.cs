using Application.Salas;
using Application.Salas.Requests;
using Application.Salas.Responses;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalasController : ApiControllerBase
{
    private readonly ISalaService _salaService;

    public SalasController(ISalaService salaService)
    {
        _salaService = salaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _salaService.ObtenerTodasLasSalas(ct);
        return result.Match(
            salas => Ok(salas),
            errores => Problem(errores)
        );
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _salaService.ObtenerSalaPorId(id, ct);
        return result.Match(
            salas => Ok(salas),
            errores => Problem(errores)
        );
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CrearSalaRequest request, CancellationToken ct)
    {
        var result = await _salaService.CrearSala(request, ct);
        return result.Match(
            sala => CreatedAtAction(nameof(GetById), new { id = sala.Id }, sala),
            errores => Problem(errores)
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] EditarSalaRequest request, CancellationToken ct)
    {
        var result = await _salaService.EditarSala(id, request, ct);
        return result.Match( 
            salaResponse => Ok(salaResponse),
            errores => Problem(errores)
        );
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await _salaService.EliminarSala(id, ct);
        return result.Match( 
            _ => NoContent(),
            errores => Problem(errores)
        );
    }
}