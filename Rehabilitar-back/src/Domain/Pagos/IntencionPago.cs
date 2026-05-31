using Domain.Enums;
using System.Text.Json;

namespace Domain.Pagos;

public class IntencionPago
{
    public Guid Id { get; private set; }
    public Guid ClienteId { get; private set; }
    public List<Guid> ActividadesIds { get; private set; }
    public decimal MontoTotal { get; private set; }
    public decimal MontoAPagar { get; private set; }
    public DateTime FechaCreacion { get; private set; }

    public bool Pagado { get; private set; }
    public EstadoDelPago Estado { get; private set; }

    #nullable disable
    private IntencionPago() { }
    #nullable enable

    private IntencionPago(Guid clienteId, List<Guid> actividadesIds, decimal montoTotal)
    {
        Id = Guid.NewGuid();
        ClienteId = clienteId;
        ActividadesIds = actividadesIds;
        MontoTotal = montoTotal;
        MontoAPagar = montoTotal;
        FechaCreacion = DateTime.UtcNow;
        Pagado = false;
        Estado = EstadoDelPago.Pendiente;
    }

    public void SetMontoAPagar(decimal monto) { MontoAPagar = monto; }

    public void MarcarPagado()
    {
        Pagado = true;
        Estado = EstadoDelPago.Pagado;
    }

    public void MarcarRechazado()
    {
        Estado = EstadoDelPago.Rechazado;
    }

    public static IntencionPago Create(Guid clienteId, List<Guid> actividadesIds, decimal montoTotal)
    {
        return new IntencionPago(clienteId, actividadesIds, montoTotal);
    }
}