namespace Application.Salas.DTOs;

public record SalaDto(
    Guid Id,
    string Nombre,
    int Capacidad
);