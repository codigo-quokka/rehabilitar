using Application.Common.Interfaces;
using Application.Pagos;
using Application.Pagos.Requests;
using Application.Reservas;
using Domain.Enums;
using Domain.Pagos;
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
    private readonly IIntencionPagoRepository _intencionPagoRepo;
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _configuration;
    private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public PagosController(IMercadoPagoService mercadoPagoService, IReservaService reservaService, 
                           IIntencionPagoRepository intencionPagoRepo,
                           IUnitOfWork uow, IConfiguration configuration)
    {
        _mercadoPagoService = mercadoPagoService;
        _reservaService = reservaService;
        _intencionPagoRepo = intencionPagoRepo;
        _uow = uow;
        _configuration = configuration;
    }

    [HttpPost("mercadopago/preferencia")]
    public async Task<IActionResult> CrearPreferencia([FromBody] CrearPreferenciaRequest request)
    {
        var reserva = await _reservaService.PrepararPagoAsync(request.ReservaId);
        
        return await reserva.MatchAsync(
            async r =>
            {
                var result = await _mercadoPagoService.CreatePreferenceAsync($"RES_{request.ReservaId}", r.MontoPendiente, "Pago de reserva");
                return result.Match(
                    p => Ok(new { preferenceId = p.PreferenceId, initPoint = p.InitPoint }),
                    errors => Problem(errors)
                );
            },
            errors => Task.FromResult(Problem(errors))
        );
    }

    [HttpPost("mercadopago/preferencia-paquete/{intencionId}")]
    public async Task<IActionResult> CrearPreferenciaPaquete(Guid intencionId, [FromBody] CrearPreferenciaPaqueteRequest request)
    {
        var intencion = await _intencionPagoRepo.GetByIdAsync(intencionId);
        if (intencion == null) return NotFound();

        intencion.SetMontoAPagar(request.Monto);
        await _uow.SaveChangesAsync();

        var result = await _mercadoPagoService.CreatePreferenceAsync($"INT_{intencionId}", request.Monto, "Paquete de clases");
        
        return result.Match(
            p => Ok(new { preferenceId = p.PreferenceId, initPoint = p.InitPoint }),
            errors => Problem(errors)
        );
    }

    [HttpPost("intencion/{intencionId}/pago-rehabilicoins")]
    public async Task<IActionResult> PagarIntencionConRehabilicoins(Guid intencionId)
    {
        var result = await _reservaService.PagarIntencionConRehabilicoinsAsync(intencionId);
        return result.Match(
            success => Ok(),
            errores => Problem(errores)
        );
    }

    [HttpDelete("intencion/{intencionId}")]
    public async Task<IActionResult> EliminarIntencionPago(Guid intencionId)
    {
        var result = await _reservaService.EliminarIntencionPagoAsync(intencionId);
        return result.Match(
            _ => NoContent(),
            errors => Problem(errors)
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

        var externalReference = result.Value.ExternalReference;
        if (externalReference.StartsWith("RES_"))
        {
            var reservaIdString = externalReference.Substring(4);
            if (!Guid.TryParse(reservaIdString, out var reservaId))
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
        else if (externalReference.StartsWith("INT_"))
        {
            var intencionIdString = externalReference.Substring(4);
            if (!Guid.TryParse(intencionIdString, out var intencionId))
            {
                return BadRequest("Invalid IntencionId format");
            }

            var pagoResult = await _reservaService.PagarIntencionConMercadoPagoAsync(intencionId);
            
            return pagoResult.Match(
                _ => Ok(),
                errors => Problem(errors)
            );
        }
        
        return BadRequest("Unknown external reference format");
    }
}

public record CrearPreferenciaRequest(Guid ReservaId);
public record CrearPreferenciaPaqueteRequest(decimal Monto);
public record WebhookPayload(string Topic, string Action, string Type, WebhookData Data);
public record WebhookData(string Id);
