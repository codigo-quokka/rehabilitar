using ErrorOr;
using Application.Reservas.DTOs;
using Domain.Enums;

namespace Application.Reservas;

public interface IReservaService
{
    Task<ErrorOr<ReservaDTO>> ReservarActividadAsync(Guid actividadId, Guid clienteId, TipoCliente tipoCliente, CancellationToken ct);
    Task<ErrorOr<Success>> ConfirmarPagoReservaAsync(Guid actividadId, Guid reservaId, CancellationToken ct);
}
