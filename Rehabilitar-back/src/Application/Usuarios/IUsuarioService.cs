using Application.Usuarios.Requests;
using Application.Usuarios.Responses;
using ErrorOr;

namespace Application.Usuarios;

public interface IUsuarioService
{
    Task<IEnumerable<UsuarioResponse>> GetAllAsync();
    Task<UsuarioResponse?> GetByIdAsync(Guid id);
    Task<ErrorOr<UsuarioResponse>> CreateAsync(CrearUsuarioRequest request);
    Task<ErrorOr<UsuarioResponse>> UpdateAsync(Guid id, EditarUsuarioRequest request);
    Task<ErrorOr<Success>> DeleteAsync(Guid id);
    Task<ErrorOr<Success>> SuspenderAsync(Guid id);
    Task<ErrorOr<Success>> ReactivarAsync(Guid id);
}
