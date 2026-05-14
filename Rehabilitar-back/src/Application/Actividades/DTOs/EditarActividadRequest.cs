namespace Application.Actividades.DTOs;
using Domain.Actividades;
using Domain.Profesores;

public record EditarActividadRequest(
    string Nombre,
    string Descripcion,
    TipoEspecialidad Tipo,
    FrecuenciaActividad Frecuencia,
    EstadoActividad Estado,
    DateTime FechaYHora,
    int CupoMaximo,
    Guid SalaId,
    Guid? ProfesorId,
    Guid? SerieId
);