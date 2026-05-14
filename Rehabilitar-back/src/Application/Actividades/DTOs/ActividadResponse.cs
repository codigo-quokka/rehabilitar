using Domain.Actividades;
using Domain.Profesores;

namespace Application.Actividades.DTOs;

public record ActividadResponse(
    Guid Id,
    string Nombre,
    string Descripcion,
    DateTime FechaYHora,
    TipoEspecialidad Tipo,
    FrecuenciaActividad Frecuencia,
    EstadoActividad Estado,
    int CupoMaximo,
    int CupoDisponible,
    Guid SalaId,
    string SalaNombre,
    Guid? ProfesorId,
    string? ProfesorNombre,
    Guid? SerieId
);