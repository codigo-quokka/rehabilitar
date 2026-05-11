namespace Application.Salas.Commands.CrearSala;

public record CrearSalaCommand(
    string Nombre,
    int Capacidad,
    string? Descripcion
);