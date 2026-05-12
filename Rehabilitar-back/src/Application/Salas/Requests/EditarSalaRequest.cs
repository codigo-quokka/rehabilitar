namespace Application.Salas.Requests;

public record EditarSalaRequest(
    string? Nombre,
    int? Capacidad,
    string? Descripcion,
    bool? Activo
);