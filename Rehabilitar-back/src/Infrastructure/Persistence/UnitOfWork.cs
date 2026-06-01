using System.Linq;
using Application.Common.Interfaces;
using Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly RehabilitarDbContext _context;
    private IDbContextTransaction? _currentTransaction;

    public UnitOfWork(RehabilitarDbContext context) => _context = context;

    public async Task<int> SaveChangesAsync(CancellationToken ct)
    {
        try
        {
            return await _context.SaveChangesAsync(ct);   
        }
        catch (DbUpdateConcurrencyException e)
        {
            System.Console.WriteLine("=== DIAG: CONCURRENCIA DETECTADA ===");
            System.Console.WriteLine($"Mensaje: {e.Message}");
            System.Console.WriteLine($"StackTrace: {e.StackTrace}");
            foreach (var entry in e.Entries)
            {
                System.Console.WriteLine($"  Entidad: {entry.Entity.GetType().Name}, State: {entry.State}");
                foreach (var prop in entry.Properties)
                {
                    System.Console.WriteLine($"    Prop: {prop.Metadata.Name}, Original: {prop.OriginalValue}, Current: {prop.CurrentValue}, IsModified: {prop.IsModified}, IsConcurrencyToken: {prop.Metadata.IsConcurrencyToken}");
                }
            }
            if (e.InnerException != null)
            {
                System.Console.WriteLine($"InnerException: {e.InnerException.GetType().Name}: {e.InnerException.Message}");
                System.Console.WriteLine($"InnerStackTrace: {e.InnerException.StackTrace}");
            }
            System.Console.WriteLine("=== DIAG: FIN CONCURRENCIA ===");
            throw new ConcurrencyException("Error de concurrencia", e);
        }
    }

    public async Task BeginTransactionAsync(CancellationToken ct = default)
    {
        if (_currentTransaction != null)
            throw new InvalidOperationException("Ya hay una transacción en curso.");

        _currentTransaction = await _context.Database.BeginTransactionAsync(ct);
    }

    public async Task CommitTransactionAsync(CancellationToken ct = default)
    {
        if (_currentTransaction == null)
        {
            throw new InvalidOperationException("No hay ninguna transacción en curso para confirmar.");
        }

        try
        {
            await _context.SaveChangesAsync(ct);
            await _currentTransaction.CommitAsync(ct);
        }
        finally
        {
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }
    }

    public void ClearChangeTracker()
    {
        _context.ChangeTracker.Clear();
    }

    public void MarkAsAdded<T>(T entity) where T : class
    {
        _context.Entry(entity).State = EntityState.Added;
    }

    public async Task RollbackTransactionAsync(CancellationToken ct = default)
    {
        if (_currentTransaction == null)
        {
            throw new InvalidOperationException("No hay ninguna transacción en curso para deshacer.");
        }
        
        try
        {
            await _currentTransaction.RollbackAsync(ct);
        }
        finally
        {
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }
    }
}
