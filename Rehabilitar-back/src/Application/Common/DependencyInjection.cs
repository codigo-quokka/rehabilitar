using Application.Salas;
using Microsoft.Extensions.DependencyInjection;

namespace Application.Common;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ISalaService, SalaService>();

        return services;
    }
}
