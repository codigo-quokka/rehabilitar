using Domain.Enums;

namespace Domain.Clientes;

public class SuscripcionAbonado
{
    public Guid Id { get; private set; }
    public Guid ClienteId { get; private set; }
    public Guid SerieId { get; private set; }
    public DateTime FechaInicio { get; private set; }
    public DateTime FechaFin { get; private set; }
    public EstadoSuscripcion Estado { get; private set; }

    private SuscripcionAbonado() { }

    private SuscripcionAbonado(Guid clienteId, Guid serieId, int mesesDuracion)
    {
        Id = Guid.NewGuid();
        ClienteId = clienteId;
        SerieId = serieId;
        FechaInicio = DateTime.UtcNow;
        FechaFin = FechaInicio.AddMonths(mesesDuracion);
        Estado = EstadoSuscripcion.Activa;
    }

    public static SuscripcionAbonado Create(Guid clienteId, Guid serieId, int mesesDuracion = 1)
    {
        return new SuscripcionAbonado(clienteId, serieId, mesesDuracion);
    }

    public void Cancelar()
    {
        Estado = EstadoSuscripcion.Cancelada;
    }

    public void Vencer()
    {
        Estado = EstadoSuscripcion.Vencida;
    }
}
