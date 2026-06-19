using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Application.Actividades;
using Domain.Actividades;

namespace Infrastructure.BackgroundServices;

public class ActividadAutoTransitionService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ActividadAutoTransitionService> _logger;
    private readonly ConcurrentDictionary<Guid, DateTime> _actividadesIniciadas = new();

    public ActividadAutoTransitionService(IServiceScopeFactory scopeFactory, ILogger<ActividadAutoTransitionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Servicio de transición automática de actividades iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessIniciarActividades(stoppingToken);
                await ProcessFinalizarActividades(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el ciclo de transición automática.");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task ProcessIniciarActividades(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IActividadRepository>();
        var service = scope.ServiceProvider.GetRequiredService<IActividadService>();

        var actividades = await repository.ObtenerActividadesPorIniciarAsync(ct);
        
        foreach (var actividad in actividades)
        {
            try
            {
                var result = await service.IniciarActividadAsync(actividad.Id, ct);
                if (!result.IsError)
                {
                    _logger.LogInformation("Actividad {Id} iniciada automáticamente.", actividad.Id);
                    _actividadesIniciadas[actividad.Id] = DateTime.Now;
                }
                else
                    _logger.LogWarning("No se pudo iniciar actividad {Id}: {Errores}",
                        actividad.Id, string.Join(", ", result.Errors.Select(e => e.Description)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al iniciar actividad {Id}.", actividad.Id);
            }
        }
    }

    private async Task ProcessFinalizarActividades(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IActividadRepository>();
        var service = scope.ServiceProvider.GetRequiredService<IActividadService>();

        var actividades = await repository.ObtenerActividadesPorFinalizarAsync(ct);
        
        foreach (var actividad in actividades)
        {
            // Safety check: if we tracked when this activity was started, ensure at least 60 min passed
            if (_actividadesIniciadas.TryGetValue(actividad.Id, out var inicio))
            {
                if (DateTime.Now - inicio < TimeSpan.FromMinutes(60))
                    continue; // Skip - hasn't been 60 min yet
            }
            else
            {
                // Activity was started manually or before service restart
                // Fall back to checking FechaYHora + 60min
                if (actividad.FechaYHora.AddMinutes(60) > DateTime.Now)
                    continue; // Skip - hasn't been 60 min yet
            }
            
            try
            {
                var result = await service.FinalizarActividadAsync(actividad.Id, ct);
                if (!result.IsError)
                {
                    _logger.LogInformation("Actividad {Id} finalizada automáticamente.", actividad.Id);
                    _actividadesIniciadas.TryRemove(actividad.Id, out _);
                }
                else
                    _logger.LogWarning("No se pudo finalizar actividad {Id}: {Errores}",
                        actividad.Id, string.Join(", ", result.Errors.Select(e => e.Description)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al finalizar actividad {Id}.", actividad.Id);
            }
        }
    }
}
