using Infrastructure.Common;
using Scalar.AspNetCore;
using API.Extensions;
using Application.Common;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var frontendUrl = builder.Configuration.GetValue<string>("Frontend:BaseUrl")
    ?? throw new InvalidOperationException("Frontend:BaseUrl is not configured.");
builder.Services.AddSingleton(new Application.Common.Settings.FrontendSettings(frontendUrl));

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Esto hace que los Enums se manden como Strings en el JSON de salida
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddFluentValidationAutoValidation();
builder.Services.ConfigureApiBehavior();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("X-Renewed-Token");
    });
});

// Configure Global Authorization Policy
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

var mpSecret = app.Configuration["MercadoPago:WebhookSecret"];
if (string.IsNullOrEmpty(mpSecret) || mpSecret == "WEBHOOK_SECRET")
{
    app.Logger.LogWarning("MercadoPago:WebhookSecret is not configured properly. Webhooks will not be validated.");
}

// Seed al iniciar la aplicación
System.Console.WriteLine();
System.Console.WriteLine("---------- SEEDING ----------");
System.Console.WriteLine();
await app.UseSeedingAsync();
System.Console.WriteLine();
System.Console.WriteLine("---------- FIN SEEDING ----------");
System.Console.WriteLine();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.MapScalarApiReference().AllowAnonymous();
    // AllowAnonymous en el MapOpenApi y MapScalarApiReference para que la documentación de la API sea accesible sin autenticación, lo cual es útil durante el desarrollo. En producción, se podría querer proteger esta documentación con autenticación.
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseMiddleware<API.Middlewares.JwtRenewalMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
