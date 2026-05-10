namespace Application.Salas.DTOs;

public record EditarSalaRequest(
    string? Nombre,
    int? Capacidad,
    string? Descripcion,
    bool? Activo
);