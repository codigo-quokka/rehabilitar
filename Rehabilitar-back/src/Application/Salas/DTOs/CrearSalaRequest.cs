namespace Application.Salas.DTOs;

public record CrearSalaRequest(
    string Nombre,
    int Capacidad,
    string? Descripcion
);