using Domain.Enums;

namespace Application.Reservas.DTOs;

public record class ReservarActividadRequest(
    Guid ActividadId,
    Guid ClienteId,
    TipoCliente TipoCliente);