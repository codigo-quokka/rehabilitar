namespace Application.Pagos.DTOs;

public record MercadoPagoPaymentResponse(string status, string external_reference, decimal? transaction_amount);