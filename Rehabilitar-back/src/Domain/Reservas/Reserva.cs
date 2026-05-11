namespace Domain.Reservas;
using Domain.Clientes;
using Domain.Actividades;

public class Reserva
{
    public Guid Id {get; init;}
    public Guid ClienteId {get; init;}
    public Guid ActividadId { get; init; }

    public Cliente Cliente {get; init;}
    public Actividad Actividad { get; init; }
    
    public DetallePago DetallePago {get; private set;}
    public EstadoDeReserva EstadoDeReserva { get; private set; } = EstadoDeReserva.Activa;

    #nullable disable
    private Reserva() { }
    #nullable enable

    private Reserva(Guid clienteId, Guid actividadId, DetallePago detallePago, EstadoDeReserva estadoDeReserva = EstadoDeReserva.Activa)
    {
        Id = Guid.NewGuid();
        ClienteId = clienteId;
        ActividadId = actividadId;
        DetallePago = detallePago; // Asumiendo un monto total fijo de 1000 para simplificar, esto debería venir de la actividad o de una configuración
        EstadoDeReserva = estadoDeReserva;
    }

    public void CancelarReserva()
    {
        if (EstadoDeReserva == EstadoDeReserva.Cancelada)
            throw new InvalidOperationException("La reserva ya está cancelada.");
        EstadoDeReserva = EstadoDeReserva.Cancelada;
    }

    public void ReactivarReserva()
    {
        if (EstadoDeReserva == EstadoDeReserva.Activa)
            throw new InvalidOperationException("La reserva ya está activa.");
        EstadoDeReserva = EstadoDeReserva.Activa;
    }

    public void ActualizarDetallePago(decimal monto)
    {
        if (DetallePago.MontoPendiente < monto)
            throw new InvalidOperationException("El monto a pagar excede el monto pendiente.");
        DetallePago = DetallePago.RegistrarPago(monto);
    }

    public static Reserva Create(Guid clienteId, Guid actividadId, DetallePago detallePago, EstadoDeReserva estadoDeReserva = EstadoDeReserva.Activa)
    {
        return new Reserva(clienteId, actividadId, detallePago, estadoDeReserva);
    }
}