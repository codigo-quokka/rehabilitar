using ErrorOr;
using Application.Actividades.DTOs;
using Application.Reservas.DTOs;
using Domain.Actividades;
using Domain.Profesores;


namespace Application.Actividades;

public interface IActividadService
{
    Task<ErrorOr<ActividadResponse>> CrearActividad(CrearActividadRequest request, CancellationToken ct = default);
    Task<ErrorOr<ActividadResponse>> CrearActividadRecurrente(CrearActividadRecurrenteRequest request, CancellationToken ct = default);
    Task<ErrorOr<ActividadResponse>> EditarActividad(Guid id, EditarActividadRequest request, CancellationToken ct = default);
    Task<ErrorOr<ActividadResponse>> ModificarActividadRecurrente(EditarActividadRecurrenteRequest request, CancellationToken ct = default);
    Task<ErrorOr<Deleted>> EliminarActividad(Guid id, CancellationToken ct = default);
    Task<ErrorOr<ActividadResponse>> ObtenerActividadPorId(Guid id, CancellationToken ct = default);
    Task<ErrorOr<List<ActividadResponse>>> ListarActividades(
        TipoEspecialidad? tipo = null,
        FrecuenciaActividad? frecuencia = null,
        EstadoActividad? estado = null,
        CancellationToken ct = default);
    
    // Task<ErrorOr<ActividadResponse>> CambiarEstadoActividad(Guid id, EstadoActividad nuevoEstado, CancellationToken ct = default);
    // Task<ErrorOr<ActividadResponse>> CambiarFechaYHoraActividad(Guid id, DateTime nuevaFechaYHora, CancellationToken ct = default);
    // Task<ErrorOr<ActividadResponse>> CambiarSalaActividad(Guid id, Guid nuevaSalaId, CancellationToken ct = default);
    // Task<ErrorOr<ActividadResponse>> AsignarProfesorActividad(Guid id, Guid profesorId, CancellationToken ct = default);
}
