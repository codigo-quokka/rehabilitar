using Application.Clientes;
using Domain.Clientes;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class SuscripcionRepository : ISuscripcionRepository
{
    private readonly RehabilitarDbContext _context;

    public SuscripcionRepository(RehabilitarDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(SuscripcionAbonado suscripcion, CancellationToken ct = default)
    {
        await _context.SuscripcionesAbonado.AddAsync(suscripcion, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<SuscripcionAbonado?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.SuscripcionesAbonado.FindAsync(new object[] { id }, ct);
    }

    public async Task<SuscripcionAbonado?> GetActivaAsync(Guid clienteId, Guid serieId, CancellationToken ct = default)
    {
        return await _context.SuscripcionesAbonado
            .FirstOrDefaultAsync(s => s.ClienteId == clienteId && 
                                     s.SerieId == serieId && 
                                     s.Estado == EstadoSuscripcion.Activa && 
                                     s.FechaFin >= DateTime.UtcNow, ct);
    }

    public async Task UpdateAsync(SuscripcionAbonado suscripcion, CancellationToken ct = default)
    {
        _context.SuscripcionesAbonado.Update(suscripcion);
        await _context.SaveChangesAsync(ct);
    }
}
