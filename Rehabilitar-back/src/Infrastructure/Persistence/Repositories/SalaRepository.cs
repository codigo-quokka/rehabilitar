using Application.Salas;
using Domain.Salas;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class SalaRepository : ISalaRepository
{
    private readonly RehabilitarDbContext _context;

    public SalaRepository(RehabilitarDbContext context) => _context = context;

    public void AgregarSala(Sala sala)
    {
        _context.Salas.Add(sala);
    }

    public void EliminarSala(Sala sala)
    {
        _context.Salas.Remove(sala);
    }

    public async Task<Sala?> ObtenerPorIdAsync(Guid id, CancellationToken ct)
    {
        // Para que FindAsync acepte un CancellationToken junto con el ID, la sintaxis de Entity Framework pide que el ID vaya dentro de un arreglo de objetos.
        // si se envía (id, ct) EFCore interpreta que tiene que buscar una pk compuesto {id + ct}.
        return await _context.Salas.FindAsync(new object[] { id } , ct);
    }

    public async Task<IEnumerable<Sala>> ObtenerTodasLasSalasAsync(CancellationToken ct = default)
    {
        return await _context.Salas.ToListAsync(ct);
    }
}