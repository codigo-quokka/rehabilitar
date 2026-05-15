namespace Application.Actividades.DTOs;

public record class CrearActividadRecurrenteRequest(
    CrearActividadRequest ActividadBase,
    DateTime FechaFinRecurrente
);
