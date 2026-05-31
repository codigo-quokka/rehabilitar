using Application.Pagos;
using Domain.Pagos;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class IntencionPagoRepository : IIntencionPagoRepository
{
    private readonly RehabilitarDbContext _context;

    public IntencionPagoRepository(RehabilitarDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(IntencionPago intencionPago, CancellationToken ct = default)
    {
        await _context.IntencionesPago.AddAsync(intencionPago, ct);
    }

    public void Update(IntencionPago intencionPago)
    {
        _context.IntencionesPago.Update(intencionPago);
    }

    public void Remove(IntencionPago intencionPago)
    {
        _context.IntencionesPago.Remove(intencionPago);
    }

    public async Task<IntencionPago?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.IntencionesPago.FindAsync(new object[] { id }, ct);
    }

    public async Task<bool> ExisteIntencionPendienteAsync(Guid clienteId, Guid actividadId, CancellationToken ct = default)
    {
        var intenciones = await _context.IntencionesPago
            .Where(i => i.ClienteId == clienteId && i.Estado == Domain.Enums.EstadoDelPago.Pendiente)
            .ToListAsync(ct);

        return intenciones.Any(i => i.ActividadesIds.Contains(actividadId));
    }

    public async Task<int> ContarIntencionesPendientesRecientesAsync(Guid actividadId, TimeSpan ventanaTiempo)
    {
        var limite = DateTime.UtcNow.Subtract(ventanaTiempo);
        var recientes = await _context.IntencionesPago
            .Where(i => i.Estado == Domain.Enums.EstadoDelPago.Pendiente && i.FechaCreacion >= limite)
            .ToListAsync();
        return recientes.Count(i => i.ActividadesIds.Contains(actividadId));
    }
}