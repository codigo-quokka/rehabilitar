using Domain.Enums;
namespace Application.Pagos.Requests;

public record RegistrarPagoRequest(
    Guid ActividadId,
    MetodoPago MetodoPago,
    decimal Monto
);