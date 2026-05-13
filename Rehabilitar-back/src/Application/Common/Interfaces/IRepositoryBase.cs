namespace Application.Common.Interfaces;

public interface IRepositoryBase<T> where T : class
{
    void Add(T entity);
    void Remove(T entity);
    void Update(T entity);
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default);
}
