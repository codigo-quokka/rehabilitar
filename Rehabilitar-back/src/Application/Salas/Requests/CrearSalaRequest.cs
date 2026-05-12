namespace Application.Salas.Requests;

public record CrearSalaRequest(
    string Nombre,
    int Capacidad,
    string? Descripcion
);
