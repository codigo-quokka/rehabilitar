using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Domain;

namespace Infrastructure.Persistence.Seeding;

public static class IdentitySeeder
{
    public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<Role>>();
        var roles = new[] { "admin", "reception", "professor", "registered_client", "guest" };

        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new Role(roleName));
                Console.WriteLine($"Rol '{roleName}' creado exitosamente.");
            }
        }
    }
}