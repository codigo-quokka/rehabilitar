namespace Application.Actividades;
using Application.Actividades.DTOs;
using Domain.Actividades;
using Domain.Profesores;

public interface IActividadRepository
{
    void CrearActividad(Actividad actividad, CancellationToken ct = default);
    void EliminarActividad(Actividad actividad, CancellationToken ct = default);
    Task<ICollection<Actividad>> ListarActividadesAsync(TipoEspecialidad? tipo = null, FrecuenciaActividad? frecuencia = null, EstadoActividad? estado = null, CancellationToken ct = default);
    Task<Actividad> ObtenerPorIdAsync(Guid actividadId, CancellationToken ct = default);
    Task<bool> ExisteActividadSuperpuestaEnSalaAsync(Guid salaId, DateTime fechaYHora, Guid? actividadId, CancellationToken ct = default);
    Task<bool> ExisteActividadSuperpuestaEnProfesorAsync(Guid profesorId, DateTime fechaYHora, Guid? actividadId, CancellationToken ct = default);
}