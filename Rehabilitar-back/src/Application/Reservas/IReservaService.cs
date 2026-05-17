using ErrorOr;
using Application.Reservas.DTOs;
using Domain.Enums;

namespace Application.Reservas;

public interface IReservaService
{
    Task<ErrorOr<ReservaDTO>> ReservarActividadAsync(ReservarActividadRequest request, CancellationToken ct = default);
    Task<ErrorOr<Success>> ConfirmarPagoReservaAsync(Guid actividadId, Guid reservaId, CancellationToken ct = default);
    Task<ErrorOr<IEnumerable<ReservaDTO>>> ObtenerReservasDeClientePorId(Guid id, CancellationToken ct = default);
}
