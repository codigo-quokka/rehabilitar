namespace Application.Reservas.DTOs;

public record class ReservarActividadRequest(
    string ActividadId,
    string ClienteId,
    string TipoCliente);