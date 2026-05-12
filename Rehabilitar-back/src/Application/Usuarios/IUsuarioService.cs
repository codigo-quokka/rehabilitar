using Application.Usuarios.Requests;
using Application.Usuarios.Responses;

namespace Application.Usuarios;

public interface IUsuarioService
{
    Task<IEnumerable<UsuarioResponse>> GetAllAsync();
    Task<UsuarioResponse?> GetByIdAsync(Guid id);
    Task<UsuarioResponse> CreateAsync(CrearUsuarioRequest request);
    Task<UsuarioResponse> UpdateAsync(Guid id, EditarUsuarioRequest request);
    Task DeleteAsync(Guid id);
    Task SuspenderAsync(Guid id);
    Task ReactivarAsync(Guid id);
}
