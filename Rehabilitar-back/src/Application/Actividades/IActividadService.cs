namespace Application.Actividades;
using Application.Actividades.DTOs;
using Domain.Enums;

public interface IActividadService
{
    Task<Guid> CrearActividadAsync(CrearActividadRequest request);
    Task EditarActividadAsync(Guid actividadId, EditarActividadRequest request);
    Task CambiarEstadoActividadAsync(Guid actividadId, EstadoActividad nuevoEstado);
    Task CambiarFechaYHoraActividadAsync(Guid actividadId, DateTime nuevaFechaYHora);
    Task CambiarSalaActividadAsync(Guid actividadId, Guid nuevaSalaId);

    Task AsignarProfesorActividadAsync(Guid actividadId, Guid profesorId);
    Task ListarActividadesAsync(TipoActividad? tipo = null, FrecuenciaActividad? frecuencia = null, EstadoActividad? estado = null);
    Task ObtenerActividadPorIdAsync(Guid actividadId);
}