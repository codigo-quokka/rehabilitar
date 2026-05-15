using Domain.Reservas;
using Domain.Enums;

namespace Application.Reservas.DTOs;

public record ReservaDTO(
    Guid Id, 
    Guid ClienteId, 
    Guid ActividadId, 
    DateTime FechaReserva,
    TipoCliente TipoCliente,
    EstadoDeReserva EstadoDeReserva,
    decimal MontoTotal, 
    decimal MontoPendiente
    );