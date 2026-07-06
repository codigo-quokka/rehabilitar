using Domain.Pagos;

namespace Application.Pagos;

public interface IIntencionPagoRepository
{
    Task AddAsync(IntencionPago intencionPago, CancellationToken ct = default);
    void Update(IntencionPago intencionPago);
    void Remove(IntencionPago intencionPago);
    Task<IntencionPago?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<int> ContarIntencionesPendientesRecientesAsync(Guid actividadId, TimeSpan ventanaTiempo);
    Task<bool> ExisteIntencionPendienteAsync(Guid clienteId, Guid actividadId, CancellationToken ct = default);
    Task<List<IntencionPago>> GetPendientesPorClienteAsync(Guid clienteId, CancellationToken ct = default);
}