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
    public decimal PorcentajeDescuentoAplicado { get; private set; }
    public EstadoDeReserva EstadoDeReserva { get; private set; } = EstadoDeReserva.Activa;
    public EstadoAsistencia Asistencia { get; private set; } = EstadoAsistencia.Pendiente;

    #nullable disable
    private Reserva() { }
    #nullable enable

    private Reserva(Guid clienteId, Guid actividadId, DetallePago detallePago, EstadoDeReserva estadoDeReserva, TipoCliente tipoCliente)
    {
        Id = Guid.NewGuid();
        ClienteId = clienteId;
        ActividadId = actividadId;
        FechaReserva = DateTime.UtcNow;
        DetallePago = detallePago; 
        EstadoDeReserva = estadoDeReserva;
        TipoCliente = tipoCliente;
        PorcentajeDescuentoAplicado = 0;
    }

    public void MarcarAsistencia() { Asistencia = EstadoAsistencia.Presente; }
    public void MarcarAusente() { Asistencia = EstadoAsistencia.Ausente; }

    public void AplicarDescuento(decimal porcentaje)
    {
        if (porcentaje <= 0) return;
        decimal montoADescontar = DetallePago.MontoTotal * porcentaje;
        DetallePago = DetallePago.AplicarDescuento(montoADescontar);
        PorcentajeDescuentoAplicado = porcentaje;
    }

    public void CancelarPorFaltaDeCupo()
    {
        if (EstadoDeReserva == EstadoDeReserva.Cancelada) return;

        if (TipoCliente == TipoCliente.Abonado)
        {
            Cliente.RecibirRehabilicoin();
        }
        else
        {
            Cliente.Reembolsar(DetallePago.MontoPagado);
        }

        EstadoDeReserva = EstadoDeReserva.Cancelada;
    }

    public void Confirmar(EstadoDeReserva nuevoEstado)
    {
        EstadoDeReserva = nuevoEstado;
    }

    public void Cancelar(double horasParaInicio)
    {
        if (EstadoDeReserva == EstadoDeReserva.Cancelada)
            throw new InvalidOperationException("La reserva ya está cancelada.");
        
        if (TipoCliente == TipoCliente.Abonado)
        {
            if (horasParaInicio >= 48)
            {
                Cliente.RecibirRehabilicoin();
                Cliente.ResetearCancelaciones();
            }
            else
            {
                Cliente.RegistrarCancelacion();
            }
        }
        else // No Abonado
        {
            if (horasParaInicio >= 24)
            {
                Cliente.Reembolsar(DetallePago.MontoPagado);
            }
        }

        EstadoDeReserva = EstadoDeReserva.Cancelada;
    }

    public void CancelarReservaPorActividadCancelada()
    {
        if (EstadoDeReserva == EstadoDeReserva.Cancelada) return;

        // Si el negocio cancela, siempre devolvemos todo sin penalidad
        if (TipoCliente == TipoCliente.Abonado)
        {
            Cliente.RecibirRehabilicoin();
            // No reseteamos cancelaciones consecutivas aquí necesariamente, 
            // ya que el usuario no "actuó" bien, simplemente no fue su culpa.
            // Pero según el espíritu de las reglas, lo dejamos así.
        }
        else
        {
            Cliente.Reembolsar(DetallePago.MontoPagado);
        }

        EstadoDeReserva = EstadoDeReserva.Cancelada;
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