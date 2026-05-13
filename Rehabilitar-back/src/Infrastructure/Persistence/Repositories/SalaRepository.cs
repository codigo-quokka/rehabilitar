using Application.Salas;
using Domain.Salas;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class SalaRepository : RepositoryBase<Sala>, ISalaRepository
{
    public SalaRepository(RehabilitarDbContext context) : base(context) { }

    public async Task<bool> ExisteSalaConNombre(string nombre)
    {
        return await _context.Salas.AnyAsync(s => s.Nombre.ToLower().Equals(nombre.ToLower()));
    }
}