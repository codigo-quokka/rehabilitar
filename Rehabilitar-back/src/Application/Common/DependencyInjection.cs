using Application.Actividades;
using Application.Auth;
using Application.Profesores;
using Application.Reservas;
using Application.Salas;
using Application.Usuarios;
using Application.AptosFisicos;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Application.Common;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ISalaService, SalaService>();
        services.AddScoped<IActividadService, ActividadService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfesorService, ProfesorService>();
        services.AddScoped<IReservaService, ReservaService>();
        services.AddScoped<IUsuarioService, UsuarioService>();
        services.AddScoped<IAptoFisicoService, AptoFisicoService>();

        services.AddValidatorsFromAssembly(System.Reflection.Assembly.GetExecutingAssembly());

        return services;

}
}
