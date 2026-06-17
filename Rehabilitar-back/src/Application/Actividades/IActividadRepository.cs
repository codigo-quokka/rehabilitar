namespace Application.Actividades;
using Application.Common.Interfaces;
using Domain.Actividades;
using Domain.Profesores;

public interface IActividadRepository : IRepositoryBase<Actividad>
{
    Task<ICollection<Actividad>> ListarActividadesAsync(TipoEspecialidad? tipo = null, FrecuenciaActividad? frecuencia = null, EstadoActividad? estado = null, Guid? profesorId = null, CancellationToken ct = default);
    Task<Actividad?> ObtenerPorIdAsync(Guid actividadId, CancellationToken ct = default);
    Task<ICollection<Actividad>> ListarPorSerieIdAsync(Guid serieId, CancellationToken ct = default);
    Task<ICollection<Actividad>> ListarPorSerieIdConReservasAsync(Guid serieId, CancellationToken ct = default);
    Task<ICollection<Actividad>> ListarPorProfesorIdAsync(Guid profesorId, CancellationToken ct = default);
    Task<bool> ExisteActividadSuperpuestaEnSalaAsync(Guid salaId, DateTime fechaYHora, Guid? actividadId, Guid serieId, CancellationToken ct = default);
    Task<bool> ExisteActividadSuperpuestaEnProfesorAsync(Guid profesorId, DateTime fechaYHora, Guid? actividadId, Guid serieId, CancellationToken ct = default);
}