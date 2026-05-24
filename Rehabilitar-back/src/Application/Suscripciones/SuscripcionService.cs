using Application.Clientes;
using Domain.Clientes;
using ErrorOr;

namespace Application.Suscripciones;

public class SuscripcionService : ISuscripcionService
{
    private readonly ISuscripcionRepository _suscripcionRepository;

    public SuscripcionService(ISuscripcionRepository suscripcionRepository)
    {
        _suscripcionRepository = suscripcionRepository;
    }

    public async Task<ErrorOr<SuscripcionAbonado>> SuscribirAsync(Guid clienteId, Guid serieId)
    {
        var suscripcionExistente = await _suscripcionRepository.GetActivaAsync(clienteId, serieId);
        if (suscripcionExistente != null)
        {
            return Error.Conflict(description: "El cliente ya tiene una suscripción activa para esta serie.");
        }

        var suscripcion = SuscripcionAbonado.Create(clienteId, serieId);
        await _suscripcionRepository.AddAsync(suscripcion);
        return suscripcion;
    }

    public async Task<ErrorOr<Deleted>> CancelarSuscripcionAsync(Guid suscripcionId)
    {
        var suscripcion = await _suscripcionRepository.GetByIdAsync(suscripcionId);
        if (suscripcion == null)
        {
            return Error.NotFound(description: "Suscripción no encontrada.");
        }

        suscripcion.Cancelar();
        await _suscripcionRepository.UpdateAsync(suscripcion);
        return Result.Deleted;
    }

    public async Task<SuscripcionAbonado?> ObtenerSuscripcionActivaAsync(Guid clienteId, Guid serieId)
    {
        return await _suscripcionRepository.GetActivaAsync(clienteId, serieId);
    }
}
