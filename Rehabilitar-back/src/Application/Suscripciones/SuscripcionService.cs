using Application.Clientes;
using Application.Common.Interfaces;
using Domain.Clientes;
using ErrorOr;

namespace Application.Suscripciones;

public class SuscripcionService : ISuscripcionService
{
    private readonly ISuscripcionRepository _suscripcionRepository;
    private readonly IClienteRepository _clienteRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SuscripcionService(ISuscripcionRepository suscripcionRepository, IClienteRepository clienteRepository, IUnitOfWork unitOfWork)
    {
        _suscripcionRepository = suscripcionRepository;
        _clienteRepository = clienteRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ErrorOr<SuscripcionAbonado>> SuscribirAsync(Guid clienteId, Guid serieId)
    {
        var cliente = await _clienteRepository.GetByIdAsync(clienteId);
        if (cliente == null)
        {
            return Error.NotFound("Cliente no encontrado.");
        }
        if (!cliente.AptoFisicoAprobado)
        {
            return Error.Forbidden("Suscripcion.AptoFisicoRequerido", "Debe tener el apto físico aprobado para suscribirse.");
        }

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
