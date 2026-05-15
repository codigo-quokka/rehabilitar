using Application.Actividades;
using Application.Auth;
using Application.Salas;
using Application.Usuarios;
using Microsoft.Extensions.DependencyInjection;

namespace Application.Common;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ISalaService, SalaService>();
        services.AddScoped<IActividadService, ActividadService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUsuarioService, UsuarioService>();

        return services;
    }
}
