using System.Text;
using Application.Auth;
using Application.Common.Interfaces;
using Application.Salas;
using Application.Seeding;
using Application.Usuarios;
using Application.Actividades;
using Domain;
using Infrastructure.Email;
using Infrastructure.Auth;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Actividades;
using Infrastructure.Persistence.Seeding;
using Infrastructure.Usuarios;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Resend;
using Application.Profesores;
using Infrastructure.Profesores;

namespace Infrastructure.Common;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Config. EFCore con SQLite
        services.AddDbContext<RehabilitarDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

        // Config. identity
        services.AddIdentity<User, Role>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = true;

            // config password: de momento contraseña simple para poder testear 
            options.Password.RequiredLength = 6;
            options.Password.RequireDigit = false;
            options.Password.RequiredUniqueChars = 0;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
        })
        .AddEntityFrameworkStores<RehabilitarDbContext>()
        .AddDefaultTokenProviders();

        // Config. auth JWT
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"] ?? throw new Exception("Jwt Secret no configurado.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
            };
        });

        // Config. Resend (emails)
        services.AddOptions<ResendClientOptions>()
            .Configure(options => {
                options.ApiToken = configuration["Resend:ApiKey"]!;
            });
        services.AddHttpClient<ResendClient>();


        // registro de servicios:
        services.AddScoped<ISeedingService, SeedingService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUsuarioService, UsuarioService>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IResend, ResendClient>();
        services.AddScoped<JwtService>();
        services.AddScoped<ISalaRepository, SalaRepository>();
        services.AddScoped<IActividadRepository, ActividadRepository>();
        services.AddScoped<IProfesorRepository, ProfesorRepository>();

        return services;
    }
}