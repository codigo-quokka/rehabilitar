namespace Application.Reservas.DTOs;

public record class ReservarActividadRequest(
    Guid ActividadId,
    Guid ClienteId);