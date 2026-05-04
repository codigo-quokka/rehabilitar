namespace Application.Actividades.DTOs;
using Domain.Enums;

public record EditarActividadRequest(
    Guid Id,
    string Nombre,
    string Descripcion,
    TipoActividad Tipo,
    FrecuenciaActividad Frecuencia,
    DateTime FechaYHora,
    int CupoMaximo,
    Guid SalaId,
    Guid? ProfesorId
);