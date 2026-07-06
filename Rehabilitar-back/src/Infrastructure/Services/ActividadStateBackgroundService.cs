using Application.Actividades;
using Application.Common.Interfaces;
using Domain.Actividades;
using Domain.Clientes;
using Domain.Reservas;
using Microsoft.EntityFrameworkCore;
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
        var repositorio = scope.ServiceProvider.GetRequiredService<IActividadRepository>();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var ahora = DateTime.Now;
        _logger.LogInformation("Estado actual: {Ahora:yyyy-MM-dd HH:mm:ss}", ahora);
        var actividadesAIniciar = await repositorio.ListarActividadesPorEstadoYAntesDeAsync(EstadoActividad.Aprobada, ahora, ct);
        foreach (var actividad in actividadesAIniciar)
        {
            actividad.IniciarClase();
            _logger.LogInformation("Actividad {ActividadId} iniciada automáticamente.", actividad.Id);
        }

        var actividadesAFinalizar = await repositorio.ListarActividadesPorEstadoYAntesDeAsync(EstadoActividad.EnCurso, ahora.AddHours(-1), ct);
        foreach (var actividad in actividadesAFinalizar)
        {
            var clienteIds = actividad.Reservas
                .Where(r => r.EstadoDeReserva == EstadoDeReserva.Activa && r.Asistencia == EstadoAsistencia.Pendiente)
                .Select(r => r.ClienteId)
                .ToList();

            var clientes = new List<Cliente>();
            foreach (var clienteId in clienteIds)
            {
                if (actividad.Reservas.FirstOrDefault(r => r.ClienteId == clienteId)?.Cliente is { } cliente)
                    clientes.Add(cliente);
            }

            actividad.FinalizarClase(clientes);
            _logger.LogInformation("Actividad {ActividadId} finalizada automáticamente.", actividad.Id);
        }

        if (actividadesAIniciar.Count > 0 || actividadesAFinalizar.Count > 0)
            await uow.SaveChangesAsync(ct);
    }
}
