namespace API.Controllers;

using Application.Profesores;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ProfesoresController : ApiControllerBase
{
    private readonly IProfesorService _profesorService;

    public ProfesoresController(IProfesorService profesorService)
    {
        _profesorService = profesorService;
    }

    [HttpGet("{profesorId:guid}/clases")]
    public async Task<IActionResult> GetMisClases(Guid profesorId, CancellationToken ct)
    {
        var result = await _profesorService.ObtenerMisClases(profesorId, ct);
        return result.Match(
            clases => Ok(clases),
            errores => Problem(errores)
        );
    }
}