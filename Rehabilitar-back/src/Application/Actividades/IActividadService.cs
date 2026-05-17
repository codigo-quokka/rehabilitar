using ErrorOr;
using Application.Actividades.DTOs;
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
    
    Task<ErrorOr<ActividadResponse>> AsignarProfesorActividad(Guid id, AsignarProfesorRequest request, CancellationToken ct = default);
    Task<ErrorOr<ActividadResponse>> RemoverProfesorActividad(Guid id, RemoverProfesorRequest request, CancellationToken ct = default);
}
