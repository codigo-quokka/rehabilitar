using Domain.Users;

namespace Application.Usuarios;

public interface IUsuarioRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default);
    Task<bool> ExistsByDniAndRoleAsync(string dni, string role, CancellationToken ct = default);
}