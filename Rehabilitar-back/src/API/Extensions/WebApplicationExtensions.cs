using Application.Seeding;

namespace API.Extensions;

public static class WebApplicationExtensions
{
    // método de extensión, extiende el tipo WebApplication (app en Program.cs) y le agrega este método para usar el seeding.
    public static async Task UseIdentitySeedingAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
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
