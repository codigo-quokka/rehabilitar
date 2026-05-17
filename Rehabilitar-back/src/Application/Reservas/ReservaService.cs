using Application.Reservas.DTOs;
using ErrorOr;
using Application.Actividades;
using Application.Clientes;
using Application.Common.Interfaces;
using Domain.Enums;
using Domain.Reservas;
using Domain.Actividades;
using Domain.Exceptions;

namespace Application.Reservas;

public class ReservaService : IReservaService
{
    private readonly IReservaRepository _reservaRepo;
    private readonly IActividadRepository _actividadRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly IUnitOfWork _uow;

    public ReservaService(IReservaRepository reservaRepo, IActividadRepository actividadRepo,
                        IClienteRepository clienteRepo, IUnitOfWork uow)
    {
        _reservaRepo = reservaRepo;
        _actividadRepo = actividadRepo;
        _clienteRepo = clienteRepo;
        _uow = uow;
    }

    public async Task<ErrorOr<ReservaDTO>> ReservarActividadAsync(ReservarActividadRequest request, CancellationToken ct)
    {
        int maxRetries = 3; // Límite de reintentos para evitar loops infinitos
        int delayPerRetry = 100; // Milisegundos opcionales

        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                var actividad = await _actividadRepo.ObtenerPorIdAsync(request.ActividadId, ct);
                if (actividad == null) return Error.NotFound("Actividad no encontrada");

                var cliente = await _clienteRepo.GetByIdAsync(request.ClienteId, ct);
                if (cliente == null) return Error.NotFound("Cliente no encontrado");

                Reserva reserva = actividad.IniciarReserva(cliente, request.TipoCliente);
                //  metodo redirigirAPago. cuando sale ya se tine info del pago
                //ConfirmarReserva
                //si el cliente tiene creditos va a agregar reserva con el pago al 100. sino tendría que ir a iniciar reserva


                // Aquí es donde EF Core comparará el 'Version' (Concurrency Token)
                await _uow.SaveChangesAsync(ct);

                return MapToReservaDTO(reserva);
            }
            catch (ConcurrencyException)
            {
                // ¡CONFLICTO DETECTADO!
                if (i == maxRetries - 1)
                    return Error.Conflict("El sistema está muy ocupado. Por favor, intenta de nuevo en unos segundos.");

                // Esperar un momento aleatorio (jitter) ayuda a reducir colisiones en el reintento
                await Task.Delay(new Random().Next(10, delayPerRetry), ct);

                // En el próximo loop, 'ObtenerPorIdAsync' traerá la versión actualizada de la DB
            }
        }

        return Error.NotFound("Error inesperado al procesar la reserva.");
    }

    public async Task<ErrorOr<Success>> ConfirmarPagoReservaAsync(Guid actividadId, Guid reservaId, CancellationToken ct)
    {
        // Reintentamos 3 veces si hay choque de versiones (concurrencia)
        for (int i = 0; i < 3; i++) {
            try {
                var actividad = await _actividadRepo.ObtenerPorIdAsync(actividadId, ct);
                if (actividad == null) return Error.NotFound("Actividad no encontrada");
                actividad.ConfirmarReserva(reservaId); // Lógica de dominio
                
                await _uow.SaveChangesAsync(ct); // Aquí EF Core valida la 'Version'
               return Result.Success;
           } catch (ConcurrencyException) {
               if (i == 2) return Error.Conflict("Sistema ocupado, reintente.");
               await Task.Delay(new Random().Next(10, 100)); // Espera aleatoria
           }
       }
       return Error.Failure();
   }

    public async Task<ErrorOr<IEnumerable<ReservaDTO>>> ObtenerReservasDeClientePorId(Guid id, CancellationToken ct = default)
    {
        var reservas = await _reservaRepo.GetReservasDeClientePorIdAsync(id, ct);
        return reservas.Select(MapToReservaDTO).ToList();
    }

    public async Task<ErrorOr<IEnumerable<ReservaDTO>>> ObtenerReservasDeActividadPorId(Guid id, CancellationToken ct = default)
    {
        var reservas = await _reservaRepo.GetReservasDeActividadPorIdAsync(id, ct);
        return reservas.Select(MapToReservaDTO).ToList();
    }

    private static ReservaDTO MapToReservaDTO(Reserva reserva)
    {
        return new ReservaDTO(
            reserva.Id,
            reserva.ClienteId,
            reserva.ActividadId,
            reserva.FechaReserva,
            reserva.TipoCliente,
            reserva.EstadoDeReserva,
            reserva.DetallePago.MontoTotal,
            reserva.DetallePago.MontoPendiente
        );
    }

}
