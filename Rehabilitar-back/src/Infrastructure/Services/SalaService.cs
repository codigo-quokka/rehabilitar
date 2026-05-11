using Application.Salas;
using Application.Salas.DTOs;
using Domain.Salas;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class SalaService : ISalaService
{
    private readonly RehabilitarDbContext _context;

    public SalaService(RehabilitarDbContext context)
    {
        _context = context;
    }

    public async Task<SalaDto> CrearSala(CrearSalaRequest request)
    {
        var sala = new Sala(request.Nombre, request.Capacidad, request.Descripcion);
        _context.Salas.Add(sala);
        await _context.SaveChangesAsync();
        return MapToDto(sala);
    }

    public async Task<SalaDto> EditarSala(Guid id, EditarSalaRequest request)
    {
        var sala = await _context.Salas.FindAsync(id);
        if (sala == null)
            throw new KeyNotFoundException("Sala no encontrada.");

        if (request.Nombre != null)
            sala.CambiarNombre(request.Nombre);
        if (request.Capacidad.HasValue)
            sala.CambiarCapacidad(request.Capacidad.Value);
        if (request.Descripcion != null)
            sala.CambiarDescripcion(request.Descripcion);
        if (request.Activo.HasValue)
        {
            if (request.Activo.Value)
                sala.Activar();
            else
                sala.Desactivar();
        }

        await _context.SaveChangesAsync();
        return MapToDto(sala);
    }

    public async Task EliminarSala(Guid id)
    {
        var sala = await _context.Salas.FindAsync(id);
        if (sala == null)
            throw new KeyNotFoundException("Sala no encontrada.");
        _context.Salas.Remove(sala);
        await _context.SaveChangesAsync();
    }

    public async Task<SalaDto> ObtenerSalaPorId(Guid id)
    {
        var sala = await _context.Salas.FindAsync(id);
        if (sala == null)
            throw new KeyNotFoundException("Sala no encontrada.");
        return MapToDto(sala);
    }

    public async Task<IEnumerable<SalaDto>> ObtenerTodasLasSalas()
    {
        var salas = await _context.Salas.ToListAsync();
        return salas.Select(MapToDto);
    }

    private static SalaDto MapToDto(Sala sala) =>
        new(sala.Id, sala.Nombre, sala.Capacidad, sala.Descripcion, sala.Activo);
}