using Application.Pagos;
using Application.Reservas.DTOs;
using ErrorOr;
using Application.Actividades;
using Application.Clientes;
using Application.Common.Interfaces;
using Domain.Reservas;
using Domain.Actividades;
using Domain.Exceptions;
using Domain.Enums;
using Domain.Pagos;
using Application.Pagos.Requests;

namespace Application.Reservas;

public class ReservaService : IReservaService
{
    private readonly IReservaRepository _reservaRepo;
    private readonly IActividadRepository _actividadRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly IIntencionPagoRepository _intencionPagoRepo;
    private readonly IUnitOfWork _uow;

    public ReservaService(IReservaRepository reservaRepo, IActividadRepository actividadRepo,
                        IClienteRepository clienteRepo, IIntencionPagoRepository intencionPagoRepo, IUnitOfWork uow)
    {
        _reservaRepo = reservaRepo;
        _actividadRepo = actividadRepo;
        _clienteRepo = clienteRepo;
        _intencionPagoRepo = intencionPagoRepo;
        _uow = uow;
    }

    public async Task<ErrorOr<Guid>> ReservarActividadAsync(ReservarActividadRequest request, CancellationToken ct = default)
    {
        var actividad = await _actividadRepo.ObtenerPorIdAsync(request.ActividadId, ct);
        if (actividad == null) return Error.NotFound("Reserva.ActividadNoEncontrada", "Actividad no encontrada");

        var reservas = await _reservaRepo.GetReservasDeActividadPorIdAsync(request.ActividadId, ct);
            
        if (reservas.Any(r => r.ClienteId == request.ClienteId && r.EstadoDeReserva != EstadoDeReserva.Cancelada))
            return Error.Conflict("Reserva.Conflict", "Ya tiene una reserva para esta actividad");

        if (await _reservaRepo.ExisteReservaParaClienteEnHorarioAsync(request.ClienteId, actividad.FechaYHora, ct))
            return Error.Conflict("Reserva.HorarioOcupado", "Ya tiene otra reserva para este mismo horario");

        // Verificar intenciones pendientes: auto-rechazar expiradas y redirigir a vigentes
        var pendientes = await _intencionPagoRepo.GetPendientesPorClienteAsync(request.ClienteId, ct);
        var expiradas = pendientes.Where(i => i.EstaExpirada()).ToList();
        foreach (var exp in expiradas)
            exp.MarcarRechazado();
        if (expiradas.Count != 0)
            await _uow.SaveChangesAsync(ct);

        var vigente = pendientes.Except(expiradas).FirstOrDefault(i => i.ActividadesIds.Contains(request.ActividadId));
        if (vigente != null)
            return vigente.Id; // Redirigir al pago existente

        var cliente = await _clienteRepo.GetByIdAsync(request.ClienteId, ct);
        if (cliente == null) return Error.NotFound("Reserva.ClienteNoEncontrado", "Cliente no encontrado");

        if (!cliente.AptoFisicoAprobado)
            return Error.Forbidden("Reserva.AptoFisicoNoAprobado", "Debe tener apto físico aprobado");

        var intencion = IntencionPago.Create(request.ClienteId, new List<Guid> { actividad.Id }, actividad.Precio);
        await _intencionPagoRepo.AddAsync(intencion, ct);
        await _uow.SaveChangesAsync(ct);
        return intencion.Id;
    }

    public async Task<ErrorOr<Guid>> ReservarActividadesRecurrentes(ReservaRecurrenteRequest request, CancellationToken ct = default)
    {
        if (request.ActividadesIds.Count < 4)
            return Error.Validation("Debe seleccionar al menos 4 clases para el paquete.");

        decimal montoTotal = 0;
        foreach (var id in request.ActividadesIds)
        {
            var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
            if (actividad == null) return Error.NotFound("Actividad.NotFound", $"Actividad {id} no encontrada");
            montoTotal += actividad.Precio;
        }

        var intencion = IntencionPago.Create(request.ClienteId, request.ActividadesIds.ToList(), montoTotal);
        await _intencionPagoRepo.AddAsync(intencion, ct);
        await _uow.SaveChangesAsync(ct);

        return intencion.Id;
    }

    public async Task<ErrorOr<Success>> PagarIntencionConRehabilicoinsAsync(Guid intencionId)
    {
        int maxIntentos = 3;
        for (int i = 0; i < maxIntentos; i++)
        {
            try
            {
                var intencion = await _intencionPagoRepo.GetByIdAsync(intencionId);
                if (intencion == null) return Error.NotFound("Intencion.NotFound", "Intención de pago no encontrada.");
                if (intencion.Estado == EstadoDelPago.Pagado) return Error.Conflict("Intencion.Pagada", "La intención ya está pagada.");

                var cliente = await _clienteRepo.GetByIdAsync(intencion.ClienteId);
                if (cliente == null) return Error.NotFound("Cliente.NotFound", "Cliente no encontrado.");

                int cantidadClases = intencion.ActividadesIds.Count;
                if (cliente.RehabiliCoins < cantidadClases)
                {
                    return Error.Validation("Cliente.SinRehabiliCoins", $"No tienes suficientes RehabiliCoins. Necesitas {cantidadClases}.");
                }

                // Descontar coins
                for (int j = 0; j < cantidadClases; j++)
                {
                    cliente.CanjearRehabilicoin();
                }

                intencion.MarcarPagado();

                var tipoCliente = intencion.ActividadesIds.Count >= 4 ? TipoCliente.Abonado : TipoCliente.noAbonado;

                foreach (var actId in intencion.ActividadesIds)
                {
                    var actividad = await _actividadRepo.ObtenerPorIdAsync(actId);
                    if (actividad != null)
                    {
                        var reserva = actividad.IniciarReserva(cliente, tipoCliente);
                        _uow.MarkAsAdded(reserva);
                        actividad.ProcesarPagoReserva(reserva.Id, actividad.Precio);
                    }
                }

                // Resetear cancelaciones del cliente al pagar
                cliente.ResetearCancelaciones();

                await _uow.SaveChangesAsync();
                return Result.Success;
            }
            catch (ConcurrencyException)
            {
                if (i == maxIntentos - 1)
                {
                    return Error.Conflict("Sistema.Ocupado", "El sistema se encuentra procesando muchas solicitudes. Por favor, reintente en unos segundos.");
                }
                _uow.ClearChangeTracker();
                await Task.Delay(new Random().Next(10, 100));
            }
        }
        return Error.Conflict("Sistema.Ocupado", "El sistema se encuentra procesando muchas solicitudes. Por favor, reintente en unos segundos.");
    }

    public async Task<ErrorOr<Success>> PagarIntencionConMercadoPagoAsync(Guid intencionId, CancellationToken ct = default)
    {
        int maxIntentos = 3;
        for (int i = 0; i < maxIntentos; i++)
        {
            try
            {
                var intencion = await _intencionPagoRepo.GetByIdAsync(intencionId, ct);
                if (intencion == null) return Error.NotFound("Intencion.NotFound", "Intención de pago no encontrada.");
                if (intencion.Estado == EstadoDelPago.Pagado) return Error.Conflict("Intencion.Pagada", "La intención ya está pagada.");

                var cliente = await _clienteRepo.GetByIdAsync(intencion.ClienteId, ct);
                if (cliente == null) return Error.NotFound("Cliente.NotFound", "Cliente no encontrado.");

                intencion.MarcarPagado();

                var tipoCliente = intencion.ActividadesIds.Count >= 4 ? TipoCliente.Abonado : TipoCliente.noAbonado;

                foreach (var actId in intencion.ActividadesIds)
                {
                    var actividad = await _actividadRepo.ObtenerPorIdAsync(actId, ct);
                    if (actividad == null) continue;

                    var reserva = actividad.IniciarReserva(cliente, tipoCliente);
                    _uow.MarkAsAdded(reserva);

                    // Para intenciones de una sola actividad (reserva individual):
                    // se usa el monto que el usuario eligió pagar (MontoAPagar).
                    // Para paquetes (múltiples actividades) se paga el precio completo
                    // ya que el frontend exige pago al 100% del total del paquete.
                    var montoAPagar = intencion.ActividadesIds.Count == 1
                        ? intencion.MontoAPagar
                        : actividad.Precio;

                    actividad.ProcesarPagoReserva(reserva.Id, montoAPagar);
                }

                // Resetear cancelaciones del cliente al pagar (consistente con ConfirmarPagoReservaAsync)
                cliente.ResetearCancelaciones();

                await _uow.SaveChangesAsync(ct);
                return Result.Success;
            }
            catch (ConcurrencyException)
            {
                if (i == maxIntentos - 1)
                {
                    return Error.Conflict("Sistema.Ocupado", "El sistema se encuentra procesando muchas solicitudes. Por favor, reintente en unos segundos.");
                }
                _uow.ClearChangeTracker();
                await Task.Delay(50 * (i + 1), ct);
            }
        }
        return Error.Conflict("Sistema.Ocupado", "El sistema se encuentra procesando muchas solicitudes. Por favor, reintente en unos segundos.");
    }

    public async Task<ErrorOr<Success>> ConfirmarPagoReservaAsync(RegistrarPagoRequest request, Guid reservaId, CancellationToken ct = default)
    {
        // Reintentamos 3 veces si hay choque de versiones (concurrencia)
        for (int i = 0; i < 3; i++) {
            try {
                var reserva = await _reservaRepo.GetByIdAsync(reservaId, ct);
                if (reserva == null) return Error.NotFound("Reserva.NotFound", "Reserva no encontrada");

                if (request.MetodoPago == MetodoPago.RehabiliCoins)
                {
                    var cliente = await _clienteRepo.GetByIdAsync(reserva.ClienteId, ct);
                    if (cliente == null) return Error.NotFound("Cliente.NotFound", "Cliente no encontrado");
                    
                    if (cliente.RehabiliCoins <= 0)
                        return Error.Validation("Cliente.SinRehabiliCoins", "No tiene RehabiliCoins suficientes.");
                    
                    // Si la reserva ya tiene un pago parcial (seña en dinero), se reembolsa
                    // porque el RehabiliCoin cubre el total de la actividad
                    if (reserva.DetallePago.MontoPagado > 0)
                    {
                        cliente.Reembolsar(reserva.DetallePago.MontoPagado);
                    }
                    
                    cliente.CanjearRehabilicoin();
                    _clienteRepo.Update(cliente);
                }

                var actividad = await _actividadRepo.ObtenerPorIdAsync(request.ActividadId, ct);
                if (actividad == null) return Error.NotFound("Reserva.ActividadNoEncontrada", "Actividad no encontrada");
                
                decimal montoAPagar = request.Monto;
                
                actividad.ProcesarPagoReserva(reservaId, montoAPagar); // Lógica de dominio actualizada
                
                // Si la reserva se completó (o alcanzó la seña), reseteamos las penalizaciones del cliente
                if (reserva.EstadoDeReserva == EstadoDeReserva.Activa || reserva.EstadoDeReserva == EstadoDeReserva.EnEspera)
                {
                    var cliente = await _clienteRepo.GetByIdAsync(reserva.ClienteId, ct);
                    if (cliente != null)
                    {
                        cliente.ResetearCancelaciones();
                        _clienteRepo.Update(cliente);
                    }
                }

                await _uow.SaveChangesAsync(ct); // Aquí EF Core valida la 'Version'
                return Result.Success;
            } catch (ConcurrencyException) {
                if (i == 2) return Error.Conflict("Sistema.Ocupado", "Sistema ocupado, reintente.");
                _uow.ClearChangeTracker();
                await Task.Delay(50 * (i + 1), ct);
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

        var actividad = await _actividadRepo.ObtenerPorIdAsync(reserva.ActividadId, ct);
        if (actividad == null) return Error.NotFound("Reserva.ActividadNoEncontrada", "Actividad no encontrada");

        return await MapToReservaResponse(reserva, actividad, ct);
    }

    public async Task<ErrorOr<ReservaResponse>> PrepararPagoAsync(Guid id, CancellationToken ct = default)
    {
        var reserva = await _reservaRepo.GetByIdAsync(id, ct);
        if (reserva == null) return Error.NotFound("Reserva.NotFound", "Reserva no encontrada");

        var cliente = await _clienteRepo.GetByIdAsync(reserva.ClienteId, ct);
        if (cliente == null) return Error.NotFound("Cliente.NotFound", "Cliente no encontrado");

        var actividad = await _actividadRepo.ObtenerPorIdAsync(reserva.ActividadId, ct);
        if (actividad == null) return Error.NotFound("Reserva.ActividadNoEncontrada", "Actividad no encontrada");

        // Si el cliente tiene descuento y no hay OTRA reserva pendiente que lo esté usando
        if (cliente.DescuentoProximaReserva > 0 && reserva.PorcentajeDescuentoAplicado == 0)
        {
            bool tieneOtraEnVuelo = await _reservaRepo.TieneReservaActivaConDescuentoAsync(cliente.UserId, reserva.Id, ct);
            if (!tieneOtraEnVuelo)
            {
                reserva.AplicarDescuento(cliente.DescuentoProximaReserva);
                await _uow.SaveChangesAsync(ct);
            }
        }

        return await MapToReservaResponse(reserva, actividad, ct);
    }

    public async Task<ErrorOr<IEnumerable<ReservaResponse>>> ObtenerReservasDeClientePorId(Guid id, CancellationToken ct = default)
    {
        var reservas = await _reservaRepo.GetReservasDeClientePorIdAsync(id, ct);
        
        var response = new List<ReservaResponse>();
        foreach (var reserva in reservas)
        {
            var actividad = await _actividadRepo.ObtenerPorIdAsync(reserva.ActividadId, ct);
            if (actividad != null)
            {
                response.Add(await MapToReservaResponse(reserva, actividad, ct));
            }
        }
        return response;
    }

    public async Task<ErrorOr<IEnumerable<ReservaResponse>>> ObtenerReservasDeActividadPorId(Guid id, CancellationToken ct = default)
    {
        var reservas = await _reservaRepo.GetReservasDeActividadPorIdAsync(id, ct);
        var actividad = await _actividadRepo.ObtenerPorIdAsync(id, ct);
        if (actividad == null) return Error.NotFound("Reserva.ActividadNoEncontrada", "Actividad no encontrada");
        
        var tasks = reservas.Select(r => MapToReservaResponse(r, actividad, ct));
        return (await Task.WhenAll(tasks)).ToList();
    }

    public async Task<ErrorOr<Deleted>> EliminarIntencionPagoAsync(Guid intencionId)
    {
        var intencion = await _intencionPagoRepo.GetByIdAsync(intencionId);
        if (intencion == null) return Error.NotFound("Intencion.NotFound", "Intención de pago no encontrada.");
        if (intencion.Estado != Domain.Enums.EstadoDelPago.Pendiente)
            return Error.Conflict("Intencion.NoPendiente", "Solo se pueden cancelar intenciones pendientes.");

        _intencionPagoRepo.Remove(intencion);
        await _uow.SaveChangesAsync();
        return Result.Deleted;
    }

    private async Task<ReservaResponse> MapToReservaResponse(Reserva reserva, Actividad actividad, CancellationToken ct = default)
    {
        string nombreCliente = reserva.Cliente.User.FirstName + " " + reserva.Cliente.User.LastName;
        
        int intencionesPendientes = await _intencionPagoRepo.ContarIntencionesPendientesRecientesAsync(actividad.Id, TimeSpan.FromMinutes(15));
        bool probabilidad = actividad.CupoMaximo > 0 && (actividad.CupoOcupado + intencionesPendientes) >= actividad.CupoMaximo;

        return new ReservaResponse(
            reserva.Id,
            reserva.ClienteId,
            nombreCliente,
            reserva.ActividadId,
            reserva.FechaReserva,
            reserva.TipoCliente,
            reserva.EstadoDeReserva,
            reserva.DetallePago.MontoTotal,
            reserva.DetallePago.MontoPendiente,
            reserva.DetallePago.MontoDescuento,
            reserva.PorcentajeDescuentoAplicado,
            probabilidad
        );
    }

}
