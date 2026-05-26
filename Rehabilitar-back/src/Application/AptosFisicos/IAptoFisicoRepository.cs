using Domain.AptosFisicos;

namespace Application.AptosFisicos;

public interface IAptoFisicoRepository
{
    void Add(AptoFisico aptoFisico);
    Task<AptoFisico?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<AptoFisico>> GetPendientesAsync(CancellationToken ct = default);
    Task<List<AptoFisico>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct = default);
    Task<List<AptoFisico>> GetUltimoPorClienteAsync(CancellationToken ct = default);
}
