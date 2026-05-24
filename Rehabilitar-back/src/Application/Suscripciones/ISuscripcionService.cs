using Domain.Clientes;
using ErrorOr;

namespace Application.Suscripciones;

public interface ISuscripcionService
{
    Task<ErrorOr<SuscripcionAbonado>> SuscribirAsync(Guid clienteId, Guid serieId);
    Task<ErrorOr<Deleted>> CancelarSuscripcionAsync(Guid suscripcionId);
    Task<SuscripcionAbonado?> ObtenerSuscripcionActivaAsync(Guid clienteId, Guid serieId);
}
