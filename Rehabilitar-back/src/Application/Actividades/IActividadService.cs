namespace Application.Actividades;
using Application.Actividades.DTOs;
using Domain.Actividades;
using Domain.Profesores;

public interface IActividadService
{
    Task<ActividadDTO> CrearActividadAsync(CrearActividadRequest request);
    Task<ActividadDTO> EditarActividadAsync(Guid actividadId, EditarActividadRequest request);
    Task<ActividadDTO> CambiarEstadoActividadAsync(Guid actividadId, EstadoActividad nuevoEstado);
    Task<ActividadDTO> CambiarFechaYHoraActividadAsync(Guid actividadId, DateTime nuevaFechaYHora);
    Task<ActividadDTO> CambiarSalaActividadAsync(Guid actividadId, Guid nuevaSalaId);

    Task<ActividadDTO> AsignarProfesorActividadAsync(Guid actividadId, Guid profesorId);
    Task<ICollection<ActividadDTO>> ListarActividadesAsync(TipoEspecialidad? tipo = null, FrecuenciaActividad? frecuencia = null, EstadoActividad? estado = null);
    Task<ActividadDTO> ObtenerActividadPorIdAsync(Guid actividadId);
}