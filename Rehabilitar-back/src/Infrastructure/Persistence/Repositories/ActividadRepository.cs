namespace Infrastructure.Persistence.Repositories;
using Application.Actividades;
using Domain.Actividades;
using Domain.Profesores;
using Microsoft.EntityFrameworkCore;

public class ActividadRepository : RepositoryBase<Actividad>, IActividadRepository
{

    public ActividadRepository(RehabilitarDbContext context) : base(context) { }

    public async Task<bool> ExisteActividadSuperpuestaEnProfesorAsync(Guid profesorId, DateTime nuevaFechaYHora, Guid? actividadId, Guid serieId, CancellationToken ct = default)
    { 
       DateTime FinEstimado = nuevaFechaYHora.AddHours(1); // Asumiendo que cada actividad dura 1 hora
        return await _context.Actividades
            .AnyAsync(
                a => a.ProfesorId == profesorId  &&
                a.FechaYHora < FinEstimado &&
                nuevaFechaYHora < a.FechaYHora.AddHours(1) &&
                a.Id != actividadId &&
                a.Estado != EstadoActividad.Cancelada,
                 ct); // chequear lógica
    }

    public async Task<bool> ExisteActividadSuperpuestaEnSalaAsync(Guid salaId, DateTime nuevaFechaYHora, Guid? actividadId, Guid serieId, CancellationToken ct = default)
    {
        DateTime FinEstimado = nuevaFechaYHora.AddHours(1); // Asumiendo que cada actividad dura 1 hora
        return await _context.Actividades
            .AnyAsync(
                a => a.SalaId == salaId  &&
                a.FechaYHora < FinEstimado &&
                nuevaFechaYHora < a.FechaYHora.AddHours(1) &&
                a.Id != actividadId &&
                a.Estado != EstadoActividad.Cancelada,
                 ct); // chequear lógica
    }
    
    public async Task<ICollection<Actividad>> ListarActividadesAsync(TipoEspecialidad? tipo = null, FrecuenciaActividad? frecuencia = null, EstadoActividad? estado = null, Guid? profesorId = null, CancellationToken ct = default)
    {
        IQueryable<Actividad> query = _context.Actividades
                                              .Include(a => a.Sala)
                                              .Include(a => a.Profesor)
                                              .ThenInclude(p => p.User)
                                              .AsQueryable();
        if (tipo.HasValue)
            query = query.Where(a => a.Tipo == tipo.Value);
        if (frecuencia.HasValue)
            query = query.Where(a => a.Frecuencia == frecuencia.Value);
        if (estado.HasValue)
            query = query.Where(a => a.Estado == estado.Value);
        if (profesorId.HasValue)
            query = query.Where(a => a.ProfesorId == profesorId.Value);

        List<Actividad> actividades = await query.ToListAsync();
        return actividades.OrderBy(a => a.FechaYHora).ToList();
    }

    public async Task<ICollection<Actividad>> ListarPorSerieIdAsync(Guid serieId, CancellationToken ct = default)
    {
        return await _context.Actividades
                             .Where(a => a.SerieId == serieId)
                             .Include(a => a.Sala)
                             .Include(a => a.Profesor)
                             .ThenInclude(p => p.User)
                             .ToListAsync(ct);
    }

    public async Task<ICollection<Actividad>> ListarPorSerieIdConReservasAsync(Guid serieId, CancellationToken ct = default)
    {
        return await _context.Actividades
                             .Where(a => a.SerieId == serieId)
                             .Include(a => a.Sala)
                             .Include(a => a.Profesor)
                             .ThenInclude(p => p.User)
                             .Include(a => a.Reservas)
                                 .ThenInclude(r => r.Cliente)
                                 .ThenInclude(c => c.User)
                             .ToListAsync(ct);
    }

    public async Task<ICollection<Actividad>> ListarPorProfesorIdAsync(Guid profesorId, CancellationToken ct = default)
    {
        return await _context.Actividades
                             .Where(a => a.ProfesorId == profesorId)
                             .Include(a => a.Sala)
                             .Include(a => a.Profesor)
                             .ThenInclude(p => p.User)
                             .ToListAsync(ct);
    }
    public async Task<Actividad?> ObtenerPorIdAsync(Guid actividadId, CancellationToken ct = default)
    {
        return await _context.Actividades
                                      .Include(a => a.Sala)
                                      .Include(a => a.Profesor)
                                      .ThenInclude(p => p.User)
                                      .Include(a => a.Reservas)
                                          .ThenInclude(r => r.Cliente)
                                          .ThenInclude(c => c.User)
                                      .FirstOrDefaultAsync(a => a.Id == actividadId, ct);
    }

    public async Task<ICollection<Actividad>> ObtenerActividadesPorIniciarAsync(CancellationToken ct)
    {
        return await _context.Actividades
            .AsNoTracking()
            .Where(a => a.Estado == EstadoActividad.Aprobada && a.FechaYHora <= DateTime.Now)
            .Include(a => a.Reservas)
            .ToListAsync(ct);
    }

    public async Task<ICollection<Actividad>> ObtenerActividadesPorFinalizarAsync(CancellationToken ct)
    {
        var tiempoLimite = DateTime.Now.AddMinutes(-60);
        return await _context.Actividades
            .AsNoTracking()
            .Where(a => a.Estado == EstadoActividad.EnCurso && a.FechaYHora <= tiempoLimite)
            .Include(a => a.Reservas)
            .ToListAsync(ct);
    }

    // public async Task<Actividad?> EditarActividadAsync(Guid actividadId, EditarActividadRequest request)
    // NO SE NECESITA PORQUE EL UOW YA LO MANEJA, SE OBTIENE LA ACTIVIDAD, SE MODIFICA Y SE GUARDA EL CAMBIO DESDE EL SERVICE

}