using ErrorOr;
using Application.Reservas.DTOs;
using Domain.Enums;

namespace Application.Reservas;

public interface IReservaService
{
    Task<ErrorOr<ReservaDTO>> ReservarActividadAsync(ReservarActividadRequest request, CancellationToken ct = default);
    Task<ErrorOr<Success>> ConfirmarPagoReservaAsync(Guid actividadId, Guid reservaId, decimal monto, CancellationToken ct = default);
    Task<ErrorOr<Deleted>> CancelarReservaAsync(Guid actividadId, Guid reservaId, CancellationToken ct = default);
    Task<ErrorOr<IEnumerable<ReservaDTO>>> ObtenerReservasDeClientePorId(Guid id, CancellationToken ct = default);
    Task<ErrorOr<IEnumerable<ReservaDTO>>> ObtenerReservasDeActividadPorId(Guid id, CancellationToken ct = default);
    Task<ErrorOr<Success>> ReservarActividadesRecurrentes(ReservaRecurrenteRequest request, CancellationToken ct);
}
