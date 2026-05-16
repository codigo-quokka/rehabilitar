namespace Application.Actividades.DTOs;

public record EditarActividadRecurrenteRequest(
    EditarActividadRequest ActividadBase,
    Guid SerieId
);
