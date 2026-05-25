namespace Domain.Reservas;

public record DetallePago(decimal MontoTotal, decimal MontoPagado, decimal MontoDescuento = 0)
{
    public decimal MontoPendiente => MontoTotal - MontoPagado - MontoDescuento;
    public bool EstaCompletado => MontoPagado + MontoDescuento >= MontoTotal;


    public DetallePago RegistrarPago(decimal monto) // Método para "evolucionar" el estado del pago (retorna una nueva instancia)
    {
        if (monto < 0) monto = 0;
        if (MontoPendiente < monto)
            throw new ArgumentException("El monto a pagar excede el monto pendiente.");
        return this with { MontoPagado = MontoPagado + monto };
    }

    public DetallePago AplicarDescuento(decimal monto)
    {
        if (monto < 0) monto = 0;
        if (MontoDescuento > 0) throw new InvalidOperationException("Ya se ha aplicado un descuento a esta reserva.");
        if (MontoPendiente < monto)
            throw new ArgumentException("El descuento excede el monto pendiente.");

        return this with { MontoDescuento = monto };
    }
}
