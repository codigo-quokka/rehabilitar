namespace Application.Pagos.Requests;

public record RegistrarPagoRequest(
    Guid ActividadId,
    string MetodoPago,
    decimal Monto
);