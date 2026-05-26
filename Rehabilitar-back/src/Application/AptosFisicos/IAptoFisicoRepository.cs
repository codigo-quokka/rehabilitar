using Application.Common.Interfaces;
using Domain.AptosFisicos;

namespace Application.AptosFisicos;

public interface IAptoFisicoRepository : IRepositoryBase<AptoFisico>
{
    Task<List<AptoFisico>> GetPendientesAsync(CancellationToken ct = default);
    Task<AptoFisico?> GetByClienteIdAsync(Guid clienteId, CancellationToken ct = default);
}
