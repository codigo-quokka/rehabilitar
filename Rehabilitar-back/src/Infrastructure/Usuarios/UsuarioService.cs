using Application.Usuarios;
using Application.Usuarios.Requests;
using Application.Usuarios.Responses;
using Domain;
using Domain.Profesores;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Usuarios;

public class UsuarioService : IUsuarioService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly RehabilitarDbContext _dbContext;

    public UsuarioService(
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        RehabilitarDbContext dbContext)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<UsuarioResponse>> GetAllAsync()
    {
        var users = await _userManager.Users.ToListAsync();
        var result = new List<UsuarioResponse>();

        foreach (var user in users)
        {
            var response = await MapToResponse(user);
            result.Add(response);
        }

        return result;
    }

    public async Task<UsuarioResponse?> GetByIdAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return null;

        return await MapToResponse(user);
    }

    public async Task<UsuarioResponse> CreateAsync(CrearUsuarioRequest request)
    {
        var user = User.Create(request.Nombre, request.Apellido, request.Email);

        var password = request.Password ?? GenerateRandomPassword();
        var result = await _userManager.CreateAsync(user, password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception($"Error al crear usuario: {errors}");
        }

        if (!await _roleManager.RoleExistsAsync(request.Rol))
        {
            await _roleManager.CreateAsync(new Role(request.Rol));
        }

        await _userManager.AddToRoleAsync(user, request.Rol);

        if (request.Rol == "professor" && !string.IsNullOrEmpty(request.Especialidad))
        {
            var especialidad = Enum.Parse<TipoEspecialidad>(request.Especialidad);
            var profesor = Profesor.Create(user.Id, especialidad);
            _dbContext.Profesores.Add(profesor);
            await _dbContext.SaveChangesAsync();
        }

        return await MapToResponse(user);
    }

    public async Task<UsuarioResponse> UpdateAsync(Guid id, EditarUsuarioRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            throw new KeyNotFoundException("Usuario no encontrado.");

        user.UpdateInfo(
            request.Nombre ?? user.FirstName,
            request.Apellido ?? user.LastName,
            request.Email ?? user.Email!
        );

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
            throw new Exception($"Error al actualizar usuario: {errors}");
        }

        if (!string.IsNullOrEmpty(request.Rol))
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);

            if (!await _roleManager.RoleExistsAsync(request.Rol))
            {
                await _roleManager.CreateAsync(new Role(request.Rol));
            }

            await _userManager.AddToRoleAsync(user, request.Rol);
        }

        if (!string.IsNullOrEmpty(request.Especialidad))
        {
            var profesor = await _dbContext.Profesores
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            var especialidad = Enum.Parse<TipoEspecialidad>(request.Especialidad);

            if (profesor != null)
            {
                profesor.CambiarEspecialidad(especialidad);
            }
            else if (request.Rol == "professor")
            {
                profesor = Profesor.Create(user.Id, especialidad);
                _dbContext.Profesores.Add(profesor);
            }

            await _dbContext.SaveChangesAsync();
        }

        return await MapToResponse(user);
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            throw new KeyNotFoundException("Usuario no encontrado.");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception($"Error al eliminar usuario: {errors}");
        }
    }

    public async Task SuspenderAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            throw new KeyNotFoundException("Usuario no encontrado.");

        await _userManager.SetLockoutEnabledAsync(user, true);
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
    }

    public async Task ReactivarAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            throw new KeyNotFoundException("Usuario no encontrado.");

        await _userManager.SetLockoutEndDateAsync(user, null);
        await _userManager.SetLockoutEnabledAsync(user, false);
    }

    private async Task<UsuarioResponse> MapToResponse(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var rol = roles.FirstOrDefault() ?? "guest";

        var cliente = await _dbContext.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == user.Id);

        var profesor = await _dbContext.Profesores
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == user.Id);

        return new UsuarioResponse
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            Nombre = user.FirstName,
            Apellido = user.LastName,
            Rol = rol,
            Activo = !(user.LockoutEnabled && user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow),
            FechaAlta = DateTime.UtcNow,
            Telefono = cliente?.Telefono,
            FechaNacimiento = cliente?.FechaNacimiento.ToString("yyyy-MM-dd"),
            Documento = cliente?.Dni.Valor,
            AptitudFisica = null,
            FechaAptitud = null,
            Especialidad = profesor?.Especialidad.ToString(),
        };
    }

    private static string GenerateRandomPassword()
    {
        const string chars = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 10).Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
