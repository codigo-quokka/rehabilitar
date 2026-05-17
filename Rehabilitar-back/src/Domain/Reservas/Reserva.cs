namespace Domain.Reservas;
using Domain.Clientes;
using Domain.Actividades;
using Domain.Enums;

public class Reserva
{
    public Guid Id {get; init;}
    public Guid ClienteId {get; init;}
    public Guid ActividadId { get; init; }
    public DateTime FechaReserva { get; private set; }
    public TipoCliente TipoCliente { get; private set; }

    public Cliente Cliente {get; init;}
    public Actividad Actividad { get; init; }
    
    public DetallePago DetallePago {get; private set;}
    public EstadoDeReserva EstadoDeReserva { get; private set; } = EstadoDeReserva.Activa;

    #nullable disable
    private Reserva() { }
    #nullable enable

    private Reserva(Guid clienteId, Guid actividadId, DetallePago detallePago, EstadoDeReserva estadoDeReserva, TipoCliente tipoCliente)
    {
        Id = Guid.NewGuid();
        ClienteId = clienteId;
        ActividadId = actividadId;
        FechaReserva = DateTime.UtcNow;
        DetallePago = detallePago; // Asumiendo un monto total fijo de 1000 para simplificar, esto debería venir de la actividad o de una configuración
        EstadoDeReserva = estadoDeReserva;
        TipoCliente = tipoCliente;
    }

    public void Confirmar(EstadoDeReserva nuevoEstado)
    {
        EstadoDeReserva = nuevoEstado;
    }

    public void Cancelar()
    {
        if (EstadoDeReserva == EstadoDeReserva.Cancelada)
            throw new InvalidOperationException("La reserva ya está cancelada.");
        EstadoDeReserva = EstadoDeReserva.Cancelada;
    }

    public void CancelarReservaPorActividadCancelada()
    {
        throw new NotImplementedException(); //hay que darle RehabiliCoins a los clientes (implementar rehabilicoins)
    }

    // public void ReactivarReserva()
    // {
    //     if (EstadoDeReserva == EstadoDeReserva.Activa)
    //         throw new InvalidOperationException("La reserva ya está activa.");
    //     EstadoDeReserva = EstadoDeReserva.Activa;
    // }

    public void ActualizarDetallePago(decimal monto)
    {
        if (DetallePago.MontoPendiente < monto)
            throw new InvalidOperationException("El monto a pagar excede el monto pendiente.");
        DetallePago = DetallePago.RegistrarPago(monto);

        // REGLA DE NEGOCIO: Si se cubre al menos el 50%, la reserva intenta pasar a Activa
        decimal señaRequerida = DetallePago.MontoTotal / 2;
        if (DetallePago.MontoPagado >= señaRequerida && EstadoDeReserva == EstadoDeReserva.PendienteDePago)
        {
            Confirmar(EstadoDeReserva.Activa);
        }
    }

    internal void PromoverAActiva()
    {
        if (EstadoDeReserva != EstadoDeReserva.EnEspera)
            throw new InvalidOperationException("Solo las reservas en espera pueden ser promovidas a activas.");
        EstadoDeReserva = EstadoDeReserva.Activa;
    }

    public static Reserva Create(Guid clienteId, Guid actividadId, DetallePago detallePago, EstadoDeReserva estadoDeReserva, TipoCliente tipoCliente)
    {
        return new Reserva(clienteId, actividadId, detallePago, estadoDeReserva, tipoCliente);
    }
}