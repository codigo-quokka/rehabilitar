using Application.Salas;
using Application.Salas.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalasController : ControllerBase
{
    private readonly ISalaService _salaService;

    public SalasController(ISalaService salaService)
    {
        _salaService = salaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var salas = await _salaService.ObtenerTodasLasSalas();
        return Ok(salas);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var sala = await _salaService.ObtenerSalaPorId(id);
            return Ok(sala);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Error = "Sala no encontrada." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CrearSalaRequest request)
    {
        var sala = await _salaService.CrearSala(request);
        return CreatedAtAction(nameof(GetById), new { id = sala.Id }, sala);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] EditarSalaRequest request)
    {
        try
        {
            var sala = await _salaService.EditarSala(id, request);
            return Ok(sala);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Error = "Sala no encontrada." });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _salaService.EliminarSala(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Error = "Sala no encontrada." });
        }
    }
}