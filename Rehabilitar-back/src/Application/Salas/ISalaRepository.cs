using Domain.Salas;

namespace Application.Salas;

public interface ISalaRepository
{
    // Commands
    void AgregarSala(Sala sala);
    void EliminarSala(Sala sala);

    // Queries
    Task<Sala?> ObtenerPorIdAsync(Guid id, CancellationToken ct);
    Task<IEnumerable<Sala>> ObtenerTodasLasSalasAsync(CancellationToken ct);
}