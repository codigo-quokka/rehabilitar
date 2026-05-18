using Application.Seeding;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace API.Extensions;

public static class WebApplicationExtensions
{
    // método de extensión, extiende el tipo WebApplication (app en Program.cs) y le agrega este método para usar el seeding.
    public static async Task UseSeedingAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        try
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<RehabilitarDbContext>();
            await dbContext.Database.MigrateAsync();
        }
        catch (Exception e)
        {
            System.Console.WriteLine("Error al migrar: " + e.Message);
            return;
        }

        try
        {
            var seeder = scope.ServiceProvider.GetRequiredService<ISeedingService>();
            await seeder.SeedAsync();
        }
        catch (Exception e)
        {
            System.Console.WriteLine("Error al seedear: " + e.Message);
        }
    }
}
