using Domain;

namespace Application.Usuarios;

public interface IUsuarioRepository
{
    Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default);
    Task<bool> ExistsByDniAndRoleAsync(string dni, string role, CancellationToken ct = default);
}