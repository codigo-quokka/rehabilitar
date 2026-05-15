using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// Repo genérico que implementa un CRUD básico para cualquier entidad.
// Si la entidad a implementar necesita métodos específicos se pueden implementar declarándolos en una interfaz en capa Application y definiéndolos en la implementación concreta en el repositorio.
// Salas ya está funcionando con un ejemplo de esto.

// Implementación:
// En Application: I[Entidad]Repository : IRepositoryBase<[Entidad]>
// En Infrastructure: [Entidad]Repository : RepositoryBase<[Entidad]>, I[Entidad]Repository

public abstract class RepositoryBase<T> : IRepositoryBase<T> where T: class
{
    protected readonly RehabilitarDbContext _context;

    protected RepositoryBase(RehabilitarDbContext context) => _context = context;

    public void Add(T entity) => _context.Set<T>().Add(entity);

    public void Remove(T entity) => _context.Set<T>().Remove(entity);

    public void Update(T entity) => _context.Set<T>().Update(entity);

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
        => await _context.Set<T>().ToListAsync(ct);

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Set<T>().FindAsync(new object[] { id }, ct);
}