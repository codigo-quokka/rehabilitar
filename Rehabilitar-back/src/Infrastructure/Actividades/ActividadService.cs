namespace Infrastructure.Actividades;
using Application.Actividades;
using Application.Actividades.DTOs;
using Domain;
using Domain.Actividades;
using Infrastructure.Persistence;
using Domain.Profesores;
using Microsoft.EntityFrameworkCore;

public class ActividadService : IActividadService
{
    private readonly RehabilitarDbContext _context;

    public ActividadService(RehabilitarDbContext context)
    {
        _context = context;
    }

    public async Task<ActividadDTO> CambiarEstadoActividadAsync(Guid actividadId, EstadoActividad nuevoEstado)
    {
        if (!Enum.IsDefined(typeof(EstadoActividad), nuevoEstado))
            throw new ArgumentException("Estado de actividad no válido.");

        var actividad = await _context.Actividades.FindAsync(actividadId);
        if (actividad == null) throw new KeyNotFoundException("Actividad no encontrada.");
        if (actividad.Estado == EstadoActividad.Finalizada)
            throw new InvalidOperationException("No se puede cambiar el estado de una actividad que ya está finalizada.");
        if (actividad.Estado != nuevoEstado)
        {   
            actividad.CambiarEstado(nuevoEstado);
            await _context.SaveChangesAsync();
        }
        return MapToDto(actividad);
    }

    public async Task<ActividadDTO> CambiarFechaYHoraActividadAsync(Guid actividadId, DateTime nuevaFechaYHora)
    {
        if (nuevaFechaYHora < DateTime.Now)
            throw new ArgumentException("La fecha y hora de la actividad no puede ser en el pasado.");

        var actividad = await _context.Actividades.FindAsync(actividadId);
        if (actividad == null) throw new KeyNotFoundException("Actividad no encontrada.");
        if (actividad.Estado == EstadoActividad.Finalizada)
            throw new InvalidOperationException("No se puede cambiar la fecha y hora de una actividad que ya está finalizada.");
        actividad.CambiarFechaYHora(nuevaFechaYHora);
        await _context.SaveChangesAsync();
        return MapToDto(actividad);
    }

    public async Task<ActividadDTO> CambiarSalaActividadAsync(Guid actividadId, Guid nuevaSalaId)
    {
        throw new NotImplementedException();
    }

    public async Task<ActividadDTO> EditarActividadAsync(Guid actividadId, EditarActividadRequest request)
    {
        throw new NotImplementedException();
    }

    public async Task<ActividadDTO> CrearActividadAsync(CrearActividadRequest request)
    {
        Sala sala = await _context.Salas.FindAsync(request.SalaId) ?? throw new ArgumentException("Sala no encontrada");
        if (sala.Capacidad < request.CupoMaximo) throw new ArgumentException("El cupo máximo no puede exceder el máximo de la sala");
        
        Profesor? profesor = null;
        if (request.ProfesorId.HasValue)
        {   
         profesor = await _context.Profesores.FindAsync(request.ProfesorId) ?? throw new ArgumentException("Profesor no encontrado");
        if (profesor.Especialidad != request.Tipo) throw new ArgumentException("El profesor no tiene la especialidad requerida para esta actividad"); 
        }

        Guid? serieId = (request.Frecuencia == FrecuenciaActividad.Recurrente) ? request.SerieId : null; // Si la actividad es recurrente, se le asigna un nuevo ID de serie, sino queda null
        var actividad = Actividad.Create(
            request.Nombre,
            request.Descripcion,
            request.Tipo,
            request.Frecuencia,
            request.Estado,
            request.FechaYHora,
            request.CupoMaximo,
            request.SalaId,
            request.ProfesorId,
            serieId
        );
        _context.Actividades.Add(actividad);
        await _context.SaveChangesAsync();
        return MapToDto(actividad);
    }

    public async Task<ICollection<ActividadDTO>> ListarActividadesAsync(TipoEspecialidad? tipo = null, FrecuenciaActividad? frecuencia = null, EstadoActividad? estado = null)
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

        List<Actividad> actividades = await query.ToListAsync();
        return actividades.Select(MapToDto).ToList();
    }

    public async Task<ActividadDTO> ObtenerActividadPorIdAsync(Guid actividadId)
    {
        throw new NotImplementedException();
    }

    public Task<ActividadDTO> AsignarProfesorActividadAsync(Guid actividadId, Guid profesorId)
    {
        throw new NotImplementedException();
    }

    private ActividadDTO MapToDto(Actividad actividad)
    {
        
        Profesor profesor = _context.Profesores.Find(actividad.ProfesorId) ?? throw new ArgumentException("Profesor no encontrado");
        return new ActividadDTO(
            actividad.Id,
            actividad.Nombre,
            actividad.Descripcion,
            actividad.FechaYHora,
            actividad.Tipo.ToString(),
            actividad.Frecuencia.ToString(),
            actividad.Estado.ToString(),
            actividad.CupoMaximo,
            actividad.CupoDisponible,
            actividad.SalaId,
            actividad.Sala.Nombre,
            actividad.ProfesorId ?? Guid.Empty, // Si no tiene profesor asignado, se devuelve un Guid vacío
            actividad.Profesor != null ? profesor.User.FirstName + " " + profesor.User.LastName: null // Si no tiene profesor asignado, se devuelve null
        );
    }
}