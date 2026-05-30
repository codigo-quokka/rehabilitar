namespace Application.Seeding;

public interface ISeedingService
{
    Task SeedRolesAsync();
    Task SeedAdminAsync();
    Task SeedAsync();
}