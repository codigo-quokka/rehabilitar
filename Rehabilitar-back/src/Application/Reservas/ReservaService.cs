using Application.Reservas.DTOs;
using ErrorOr;
using Application.Actividades;
using Application.Clientes;
using Application.Suscripciones;
using Application.Common.Interfaces;
using Domain.Reservas;
using Domain.Actividades;
using Domain.Exceptions;
using Domain.Enums;
using Application.Pagos.Requests;

namespace Application.Reservas;

public class ReservaService : IReservaService
{
    private readonly IReservaRepository _reservaRepo;
    private readonly IActividadRepository _actividadRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly ISuscripcionService _suscripcionService;
    private readonly IUnitOfWork _uow;

    public ReservaService(IReservaRepository reservaRepo, IActividadRepository actividadRepo,
                        IClienteRepository clienteRepo, ISuscripcionService suscripcionService, IUnitOfWork uow)
    {
        _reservaRepo = reservaRepo;
        _actividadRepo = actividadRepo;
        _clienteRepo = clienteRepo;
        _suscripcionService = suscripcionService;
        _uow = uow;
    }

    public async Task<ErrorOr<ReservaResponse>> ReservarActividadAsync(ReservarActividadRequest request, CancellationToken ct = default)
    {
        int maxRetries = 3; // Límite de reintentos para evitar loops infinitos
        int delayPerRetry = 100; // Milisegundos opcionales

        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                var reservas = await _reservaRepo.GetReservasDeActividadPorIdAsync(request.ActividadId, ct);
                    
                if (reservas.Any(r => r.ClienteId == request.ClienteId && r.EstadoDeReserva != EstadoDeReserva.Cancelada))
                    return Error.Conflict("Reserva.Conflict", "Ya tiene una reserva para esta actividad");
                
                var actividad = await _actividadRepo.ObtenerPorIdAsync(request.ActividadId, ct);
                if (actividad == null) return Error.NotFound("Reserva.ActividadNoEncontrada", "Actividad no encontrada");

                var suscripcion = await _suscripcionService.ObtenerSuscripcionActivaAsync(request.ClienteId, actividad.SerieId ?? Guid.Empty);
                var tipoCliente = suscripcion != null ? TipoCliente.Abonado : TipoCliente.noAbonado;

                var cliente = await _clienteRepo.GetByIdAsync(request.ClienteId, ct);
                if (cliente == null) return Error.NotFound("Reserva.ClienteNoEncontrado", "Cliente no encontrado");

                if (!cliente.AptoFisicoAprobado)
                    return Error.Forbidden("Reserva.AptoFisicoNoAprobado", "Debe tener apto físico aprobado");

                Reserva reserva = actividad.IniciarReserva(cliente, tipoCliente);
                _reservaRepo.Add(reserva);

                await _uow.SaveChangesAsync(ct);

                var reservaCompleta = await _reservaRepo.GetByIdAsync(reserva.Id, ct);
                if (reservaCompleta == null)
                    return Error.NotFound("Reserva.NotFound", "Error al recuperar la reserva después de crearla.");

                return MapToReservaResponse(reservaCompleta);
            }
            catch (ConcurrencyException ex)
            {
                System.Console.WriteLine($"ReservaService: ConcurrencyException en intento {i + 1}/{maxRetries}: {ex.InnerException?.Message}");

                if (i == maxRetries - 1)
                    return Error.Conflict("Sistema.Ocupado", "El sistema está muy ocupado. Por favor, intenta de nuevo en unos segundos.");

                _uow.ClearChangeTracker();
                await Task.Delay(new Random().Next(10, delayPerRetry), ct);
            }
        }

        return Error.NotFound("Error inesperado al procesar la reserva.");
    }

    public async Task<ErrorOr<Success>> ReservarActividadesRecurrentes(ReservaRecurrenteRequest request, CancellationToken ct = default)
    {
        foreach (Actividad a in request.Actividades)
        {
            var suscripcion = await _suscripcionService.ObtenerSuscripcionActivaAsync(request.ClienteId, a.SerieId ?? Guid.Empty);
            var tipoCliente = suscripcion != null ? TipoCliente.Abonado : TipoCliente.noAbonado;

            ReservarActividadRequest nuevaReserva = new ReservarActividadRequest(
                a.Id, 
                request.ClienteId,
                tipoCliente
            );
            await ReservarActividadAsync(nuevaReserva, ct);
        }
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ConfirmarPagoReservaAsync(RegistrarPagoRequest request, Guid reservaId, CancellationToken ct = default)
    {
        // Reintentamos 3 veces si hay choque de versiones (concurrencia)
        for (int i = 0; i < 3; i++) {
            try {
                var actividad = await _actividadRepo.ObtenerPorIdAsync(request.ActividadId, ct);
                if (actividad == null) return Error.NotFound("Reserva.ActividadNoEncontrada", "Actividad no encontrada");
                
                actividad.ProcesarPagoReserva(reservaId, request.Monto); // Lógica de dominio actualizada
                
                await _uow.SaveChangesAsync(ct); // Aquí EF Core valida la 'Version'
                return Result.Success;
            } catch (ConcurrencyException) {
                if (i == 2) return Error.Conflict("Sistema.Ocupado", "Sistema ocupado, reintente.");
                _uow.ClearChangeTracker();
                await Task.Delay(new Random().Next(10, 100), ct);
            }
        }
        return Error.Failure();
    }

    public async Task<ErrorOr<Deleted>> CancelarReservaAsync(Guid actividadId, Guid reservaId, CancellationToken ct = default)
    {
        for (int i = 0; i < 3; i++) {
            try {
                var actividad = await _actividadRepo.ObtenerPorIdAsync(actividadId, ct);
                if (actividad == null) return Error.NotFound("Reserva.ActividadNoEncontrada", "Actividad no encontrada");

                                
                actividad.CancelarReserva(reservaId); // Lógica de dominio
                
                await _uow.SaveChangesAsync(ct);
                return Result.Deleted;
            } catch (ConcurrencyException) {
                if (i == 2) return Error.Conflict("Sistema.Ocupado", "Sistema ocupado, reintente.");
                _uow.ClearChangeTracker();
                await Task.Delay(new Random().Next(10, 100), ct);
            }
        }
        return Error.Failure();
    }

    public async Task<ErrorOr<ReservaResponse>> ObtenerReservaPorId(Guid id, CancellationToken ct = default)
    {
        var reserva = await _reservaRepo.GetByIdAsync(id, ct);

        if (reserva == null)
            return Error.NotFound("Reserva.NotFound", "Reserva no encontrada");

        return MapToReservaResponse(reserva);
    }

    public async Task<ErrorOr<IEnumerable<ReservaResponse>>> ObtenerReservasDeClientePorId(Guid id, CancellationToken ct = default)
    {
        var reservas = await _reservaRepo.GetReservasDeClientePorIdAsync(id, ct);
        return reservas.Select(MapToReservaResponse).ToList();
    }

    public async Task<ErrorOr<IEnumerable<ReservaResponse>>> ObtenerReservasDeActividadPorId(Guid id, CancellationToken ct = default)
    {
        var reservas = await _reservaRepo.GetReservasDeActividadPorIdAsync(id, ct);
        return reservas.Select(MapToReservaResponse).ToList();
    }

    private static ReservaResponse MapToReservaResponse(Reserva reserva)
    {
        string nombreCliente = reserva.Cliente.User.FirstName + " " + reserva.Cliente.User.LastName;
        return new ReservaResponse(
            reserva.Id,
            reserva.ClienteId,
            nombreCliente,
            reserva.ActividadId,
            reserva.FechaReserva,
            reserva.TipoCliente,
            reserva.EstadoDeReserva,
            reserva.DetallePago.MontoTotal,
            reserva.DetallePago.MontoPendiente
        );
    }

}
