using Application.Usuarios;
using Application.Usuarios.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ApiControllerBase
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
        var result = await _usuarioService.CreateAsync(request);
        return result.Match(
            usuario => CreatedAtAction(nameof(GetById), new { id = usuario.Id }, usuario),
            errors => Problem(errors)
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] EditarUsuarioRequest request)
    {
        var result = await _usuarioService.UpdateAsync(id, request);
        return result.Match(
            usuario => Ok(usuario),
            errors => Problem(errors)
        );
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _usuarioService.DeleteAsync(id);
        return result.Match(
            _ => NoContent(),
            errors => Problem(errors)
        );
    }

    [HttpPut("{id:guid}/suspender")]
    public async Task<IActionResult> Suspender(Guid id)
    {
        var result = await _usuarioService.SuspenderAsync(id);
        return result.Match(
            _ => Ok(new { Message = "Usuario suspendido exitosamente." }),
            errors => Problem(errors)
        );
    }

    [HttpPut("{id:guid}/reactivar")]
    public async Task<IActionResult> Reactivar(Guid id)
    {
        var result = await _usuarioService.ReactivarAsync(id);
        return result.Match(
            _ => Ok(new { Message = "Usuario reactivado exitosamente." }),
            errors => Problem(errors)
        );
    }
}
