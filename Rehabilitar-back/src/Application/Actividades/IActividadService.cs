using ErrorOr;
using Application.Actividades.DTOs;

namespace Application.Actividades;

public interface IActividadService
{
    Task<ErrorOr<ActividadResponse>> CrearActividad(CrearActividadRequest request, CancellationToken ct = default);
    Task<ErrorOr<ActividadResponse>> EditarActividad(Guid id, EditarActividadRequest request, CancellationToken ct = default);
    Task<ErrorOr<Deleted>> EliminarActividad(Guid id, CancellationToken ct = default);
    Task<ErrorOr<ActividadResponse>> ObtenerActividadPorId(Guid id, CancellationToken ct = default);
    
    
    // Task<ErrorOr<ActividadResponse>> CambiarEstadoActividad(Guid id, EstadoActividad nuevoEstado, CancellationToken ct = default);
    // Task<ErrorOr<ActividadResponse>> CambiarFechaYHoraActividad(Guid id, DateTime nuevaFechaYHora, CancellationToken ct = default);
    // Task<ErrorOr<ActividadResponse>> CambiarSalaActividad(Guid id, Guid nuevaSalaId, CancellationToken ct = default);
    // Task<ErrorOr<ActividadResponse>> AsignarProfesorActividad(Guid id, Guid profesorId, CancellationToken ct = default);
}
