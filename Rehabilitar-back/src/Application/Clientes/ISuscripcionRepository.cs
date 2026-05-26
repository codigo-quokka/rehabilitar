using Domain.Clientes;

namespace Application.Clientes;

public interface ISuscripcionRepository
{
    Task AddAsync(SuscripcionAbonado suscripcion, CancellationToken ct = default);
    Task<SuscripcionAbonado?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<SuscripcionAbonado?> GetActivaAsync(Guid clienteId, Guid serieId, CancellationToken ct = default);
    Task UpdateAsync(SuscripcionAbonado suscripcion, CancellationToken ct = default);
}
