using System.Net.Http.Json;
using Application.Common.Interfaces;
using Application.Pagos.DTOs;
using ErrorOr;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class MercadoPagoService : IMercadoPagoService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<MercadoPagoService> _logger;

    public MercadoPagoService(HttpClient httpClient, IConfiguration config, ILogger<MercadoPagoService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<ErrorOr<(string PreferenceId, string InitPoint)>> CreatePreferenceAsync(string externalReference, decimal amount, string description)
    {
        // meto este fix de no http para poder usarlo en localhost y que mercadopago no rompa los huevos
        // si no se configura se harcodea el localhost:5173
        var frontendUrl = _config["Frontend:BaseUrlNoHttp"] ?? "localhost:5173";
        var webhookUrl = _config["MercadoPago:WebhookUrl"];
        var preference = new
        {
            items = new[]
            {
                new
                {
                    title = description,
                    quantity = 1,
                    unit_price = amount
                }
            },
            external_reference = externalReference,
            back_urls = new
            {
                success = $"{frontendUrl}/reservas/pago/exito",
                failure = $"{frontendUrl}/reservas/pago/error",
                // pending = $"{frontendUrl}/reservas/pago/pendiente"
            },
            auto_return = "approved",
            notification_url = webhookUrl,

            payment_methods = new
            {
                excluded_payment_types = new[]
                {
                    new { id = "ticket" }, // Bloquea Rapipago, Pago Fácil, etc.
                    new { id = "atm" }     // Bloquea pagos por cajero automático
                }
            }
        };

        var response = await _httpClient.PostAsJsonAsync("checkout/preferences", preference);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("Error al crear preferencia en MercadoPago. Status: {StatusCode}, Response: {Response}", response.StatusCode, errorContent);
            return Error.Failure("MercadoPago.CreatePreference", "No se pudo crear la preferencia en MercadoPago.");
        }

        var result = await response.Content.ReadFromJsonAsync<MercadoPagoPreferenceResponse>();
        if (result?.id == null || result?.init_point == null)
            return Error.Failure("MercadoPago.CreatePreference", "No se pudo obtener el ID o el InitPoint de la preferencia.");

        return (result.id, result.init_point);
    }

    public async Task<ErrorOr<(bool IsApproved, string ExternalReference, decimal? TransactionAmount)>> GetPaymentStatusAsync(string paymentId)
    {
        var response = await _httpClient.GetAsync($"v1/payments/{paymentId}");
        if (!response.IsSuccessStatusCode)
            return Error.Failure("MercadoPago.GetPaymentStatus", "No se pudo obtener el estado del pago en MercadoPago.");

        var result = await response.Content.ReadFromJsonAsync<MercadoPagoPaymentResponse>();
        
        if (result == null)
            return Error.Failure("MercadoPago.GetPaymentStatus", "No se pudo obtener el estado del pago en MercadoPago.");
        
        return (result.status == "approved", result.external_reference, result.transaction_amount);
    }
}
