using Application.Common.Interfaces;
using Application.Reservas.DTOs;
using Domain.Reservas;

namespace Application.Reservas;

public interface IReservaRepository : IRepositoryBase<Reserva>
{
    Task<IEnumerable<Reserva>> GetReservasDeActividadPorIdAsync(Guid id, CancellationToken ct);
    Task<IEnumerable<Reserva>> GetReservasDeClientePorIdAsync(Guid userId, CancellationToken ct = default);
}