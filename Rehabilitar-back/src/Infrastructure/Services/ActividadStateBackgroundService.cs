using Application.Actividades;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class ActividadStateBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ActividadStateBackgroundService> _logger;
    private static readonly TimeSpan Periodicidad = TimeSpan.FromMinutes(1);

    public ActividadStateBackgroundService(IServiceProvider serviceProvider, ILogger<ActividadStateBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ActividadStateBackgroundService iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcesarTransicionesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar transiciones de estado de actividades.");
            }

            await Task.Delay(Periodicidad, stoppingToken);
        }
    }

    private async Task ProcesarTransicionesAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var actividadService = scope.ServiceProvider.GetRequiredService<IActividadService>();
        await actividadService.AplicarTransicionesDeEstadoAsync(ct);
    }
}
