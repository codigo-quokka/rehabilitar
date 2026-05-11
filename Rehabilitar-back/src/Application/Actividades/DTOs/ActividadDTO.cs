namespace Application.Actividades.DTOs;

public record ActividadDTO(
    Guid Id,
    string Nombre,
    string Descripcion,
    DateTime FechaYHora,
    string Tipo,
    string Frecuencia,
    string Estado,
    int CupoMaximo,
    int CupoDisponible,
    Guid SalaId,
    string SalaNombre,
    Guid? ProfesorId,
    string? ProfesorNombre
);