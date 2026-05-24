using Application.Common.Interfaces;
using Application.Pagos.Requests;
using Application.Reservas;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace API.Controllers;

[Route("api/[controller]")]
public class PagosController : ApiControllerBase
{
    private readonly IMercadoPagoService _mercadoPagoService;
    private readonly IReservaService _reservaService;
    private readonly IConfiguration _configuration;
    private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public PagosController(IMercadoPagoService mercadoPagoService, IReservaService reservaService, IConfiguration configuration)
    {
        _mercadoPagoService = mercadoPagoService;
        _reservaService = reservaService;
        _configuration = configuration;
    }

    [HttpPost("mercadopago/preferencia")]
    public async Task<IActionResult> CrearPreferencia([FromBody] CrearPreferenciaRequest request)
    {
        var reserva = await _reservaService.ObtenerReservaPorId(request.ReservaId);
        
        return await reserva.MatchAsync(
            async r =>
            {
                var result = await _mercadoPagoService.CreatePreferenceAsync(request.ReservaId.ToString(), r.MontoTotal, "Pago de reserva");
                return result.Match(
                    p => Ok(new { preferenceId = p.PreferenceId, initPoint = p.InitPoint }),
                    errors => Problem(errors)
                );
            },
            errors => Task.FromResult(Problem(errors))
        );
    }

    [AllowAnonymous]
    [HttpPost("mercadopago/webhook")]
    public async Task<IActionResult> Webhook([FromHeader(Name = "x-signature")] string? signature, [FromHeader(Name = "x-request-id")] string? requestId)
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();
        
        var secret = _configuration["MercadoPago:WebhookSecret"];
        if (string.IsNullOrEmpty(secret)) return Unauthorized();

        var payload = JsonSerializer.Deserialize<WebhookPayload>(body, _jsonOptions);
        
        // Ignore test webhooks
        if (payload?.Type == "test" || payload?.Topic == "test") return Ok();

        // Parse x-signature header (format: ts=...,v1=...)
        if (string.IsNullOrEmpty(signature)) return Unauthorized();
        var signatureParts = signature.Split(',');
        string ts = null;
        string v1 = null;
        foreach (var part in signatureParts)
        {
            if (part.StartsWith("ts=")) ts = part.Substring(3);
            else if (part.StartsWith("v1=")) v1 = part.Substring(3);
        }

        if (string.IsNullOrEmpty(ts) || string.IsNullOrEmpty(v1)) return Unauthorized();

        // Get data.id
        var dataId = Request.Query["data.id"].ToString();
        if (string.IsNullOrEmpty(dataId))
        {
            dataId = payload?.Data?.Id;
            if (string.IsNullOrEmpty(dataId)) return BadRequest();
        }

        // Construct manifest
        var manifest = $"id:{dataId};request-id:{(requestId ?? "")};ts:{ts};";

        // Calculate HMAC
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(manifest));
        var signatureCalculated = Convert.ToHexString(hash).ToLowerInvariant();
        
        if (signatureCalculated != v1) return Unauthorized();

        var result = await _mercadoPagoService.GetPaymentStatusAsync(dataId);
        
        // Always return Ok to MercadoPago to stop retries, even if payment is not approved or not found
        if (result.IsError || !result.Value.IsApproved) return Ok();

        if (!Guid.TryParse(result.Value.ReservaId, out var reservaId))
        {
            return BadRequest("Invalid ReservaId format");
        }
        
        var reserva = await _reservaService.ObtenerReservaPorId(reservaId);
        
        return await reserva.MatchAsync(
            async r =>
            {
                var pagoRequest = new RegistrarPagoRequest(r.ActividadId, MetodoPago.MercadoPago, r.MontoTotal);
                var confirmResult = await _reservaService.ConfirmarPagoReservaAsync(pagoRequest, reservaId);
                
                return confirmResult.Match(
                    _ => Ok(),
                    errors => Problem(errors)
                );
            },
            errors => Task.FromResult(Problem(errors))
        );
    }
}

public record CrearPreferenciaRequest(Guid ReservaId);
public record WebhookPayload(string Topic, string Action, string Type, WebhookData Data);
public record WebhookData(string Id);
