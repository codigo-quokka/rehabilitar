namespace Domain.Reservas;

public record DetallePago(decimal MontoTotal, decimal MontoPagado)
{
    public decimal MontoPendiente => MontoTotal - MontoPagado;
    public bool EstaCompletado => MontoPagado == MontoTotal;
    
    
    public DetallePago RegistrarPago(decimal monto) // Método para "evolucionar" el estado del pago (retorna una nueva instancia)
    {
        if (MontoPendiente < monto)
            throw new ArgumentException("El monto a pagar excede el monto pendiente.");
        return this with { MontoPagado = MontoPagado + monto };
    }
}
