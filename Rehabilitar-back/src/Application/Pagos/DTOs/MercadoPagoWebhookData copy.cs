namespace Application.Pagos.DTOs;

// id opcional por si el JSON viene con otro formato
public record MercadoPagoWebhookData(string? id);