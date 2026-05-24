namespace Application.Pagos.DTOs;

// todo nullable para soportar tanto Webhooks como IPNs
public record MercadoPagoWebhookPayload(
    string? action,
    string? api_version,
    MercadoPagoWebhookData? data,
    string? topic,
    string? resource
);