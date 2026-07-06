using Application.Notificaciones;
using Application.Notificaciones.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificacionesController : ApiControllerBase
{
    private readonly INotificacionService _notificacionService;

    public NotificacionesController(INotificacionService notificacionService)
    {
        _notificacionService = notificacionService;
    }

    [HttpPost]
    public async Task<IActionResult> CrearNotificacion(CrearNotificacionRequest request)
    {
        var result = await _notificacionService.CrearNotificacionAsync(request.UserId, request.Titulo, request.Mensaje);
        
        return result.Match(
            notificacion => Ok(notificacion),
            errores => Problem(errores)
        );
    }

    [HttpPost("{notificacionId}/marcar-como-leida")]
    public async Task<IActionResult> MarcarComoLeida(Guid notificacionId)
    {
        var result = await _notificacionService.MarcarNotificacionComoLeidaAsync(notificacionId);
        
        return result.Match(
            notificacion => Ok(notificacion),
            errores => Problem(errores)
        );
    }

    [HttpPost("{notificacionId}/marcar-como-no-leida")]
    public async Task<IActionResult> MarcarComoNoLeida(Guid notificacionId)
    {
        var result = await _notificacionService.MarcarNotificacionComoNoLeidaAsync(notificacionId);
        
        return result.Match(
            notificacion => Ok(notificacion),
            errores => Problem(errores)
        );
    }

    [HttpDelete("{notificacionId}")]
    public async Task<IActionResult> EliminarNotificacion(Guid notificacionId)
    {
        var result = await _notificacionService.EliminarNotificacionAsync(notificacionId);

        return result.Match(
            _ => Ok(new { mensaje = "Notificación eliminada correctamente" }),
            errores => Problem(errores)
        );
    }

    [HttpGet("mis-notificaciones")]
    public async Task<IActionResult> GetMisNotificaciones()
    {
        var userId = GetCurrentUserId();
        var result = await _notificacionService.GetNotificacionesPorUsuarioAsync(userId);

        return result.Match(
            notificaciones => Ok(notificaciones),
            errores => Problem(errores)
        );
    }
}
