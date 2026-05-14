using Application.Usuarios;
using Application.Usuarios.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuariosController(IUsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var usuarios = await _usuarioService.GetAllAsync();
        return Ok(usuarios);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var usuario = await _usuarioService.GetByIdAsync(id);
        if (usuario == null)
            return NotFound(new { Error = "Usuario no encontrado." });

        return Ok(usuario);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CrearUsuarioRequest request)
    {
        try
        {
            var usuario = await _usuarioService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = usuario.Id }, usuario);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] EditarUsuarioRequest request)
    {
        try
        {
            var usuario = await _usuarioService.UpdateAsync(id, request);
            return Ok(usuario);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Error = "Usuario no encontrado." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _usuarioService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Error = "Usuario no encontrado." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpPut("{id:guid}/suspender")]
    public async Task<IActionResult> Suspender(Guid id)
    {
        try
        {
            await _usuarioService.SuspenderAsync(id);
            return Ok(new { Message = "Usuario suspendido exitosamente." });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Error = "Usuario no encontrado." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpPut("{id:guid}/reactivar")]
    public async Task<IActionResult> Reactivar(Guid id)
    {
        try
        {
            await _usuarioService.ReactivarAsync(id);
            return Ok(new { Message = "Usuario reactivado exitosamente." });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Error = "Usuario no encontrado." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
}
