using Application.Usuarios;
using Domain;
using Domain.Clientes; // Added for Dni class
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// este no hereda del base porque usa el UserManager no el DbContext
// lo uso para inyectar métodos específicos como por ejemplo el GetAllAsync
// el ToListAsync() es de EFCore (package en infra pero no en application).
// esto se podría usar como si UserManager fuera el DbContext para inyectar en application para no inyectar directamente el UserManager, pero es básicamente reinventar la rueda.
// UserManager es, esencialmente, un "repository" que internamente usa el DbContext.
public class UsuarioRepository : IUsuarioRepository
{
    private readonly UserManager<User> _userManager;

    public UsuarioRepository(UserManager<User> userManager) => _userManager = userManager;

    public async Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default)
        => await _userManager.Users.ToListAsync(ct);

    public async Task<bool> ExistsByDniAndRoleAsync(string dni, string role, CancellationToken ct = default)
    {
        var dniValue = new Dni(dni);
        var usersWithDni = await _userManager.Users
            .Where(u => u.Dni.Equals(dniValue))
            .ToListAsync(ct);

        foreach (var user in usersWithDni)
        {
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains(role))
                return true;
        }

        return false;
    }
}
