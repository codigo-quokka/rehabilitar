namespace Application.Actividades.DTOs;
using Domain.Actividades;
using Domain.Profesores;

public record EditarActividadRequest(
    Guid Id,
    string Nombre,
    string Descripcion,
    TipoEspecialidad Tipo,
    FrecuenciaActividad Frecuencia,
    DateTime FechaYHora,
    int CupoMaximo,
    Guid SalaId,
    Guid? ProfesorId
);