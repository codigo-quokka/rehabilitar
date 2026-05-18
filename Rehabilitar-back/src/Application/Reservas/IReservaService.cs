using ErrorOr;
using Application.Reservas.DTOs;

namespace Application.Reservas;

public interface IReservaService
{
    Task<ErrorOr<ReservaResponse>> ReservarActividadAsync(ReservarActividadRequest request, CancellationToken ct = default);
    Task<ErrorOr<Success>> ConfirmarPagoReservaAsync(Guid actividadId, Guid reservaId, decimal monto, CancellationToken ct = default);
    Task<ErrorOr<Deleted>> CancelarReservaAsync(Guid actividadId, Guid reservaId, CancellationToken ct = default);
    Task<ErrorOr<ReservaResponse>> ObtenerReservaPorId(Guid id, CancellationToken ct = default);
    Task<ErrorOr<IEnumerable<ReservaResponse>>> ObtenerReservasDeClientePorId(Guid id, CancellationToken ct = default);
    Task<ErrorOr<IEnumerable<ReservaResponse>>> ObtenerReservasDeActividadPorId(Guid id, CancellationToken ct = default);
    Task<ErrorOr<Success>> ReservarActividadesRecurrentes(ReservaRecurrenteRequest request, CancellationToken ct = default);
}
