using Domain.Reservas;
using Domain.Enums;

namespace Application.Reservas.DTOs;

public record ReservaResponse(
    Guid Id, 
    Guid ClienteId, 
    string NombreCliente,
    Guid ActividadId,
    DateTime FechaReserva,
    TipoCliente TipoCliente,
    EstadoDeReserva EstadoDeReserva,
    decimal MontoTotal, 
    decimal MontoPendiente,
    decimal MontoDescuento,
    decimal PorcentajeDescuentoAplicado,
    bool ProbabilidadListaEspera
    );