using Domain;

namespace Application.Usuarios;

public interface IUsuarioRepository
{
    Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default);
}