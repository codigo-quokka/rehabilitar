namespace Application.Salas.Responses;

public record SalaResponse(
    Guid Id,
    string Nombre,
    int Capacidad,
    string? Descripcion,
    bool Activo
);