namespace Domain.Clientes;

public record SaldoAFavor(decimal MontoTotal)
{    
    public SaldoAFavor RestarSaldo(decimal monto) // Método para "evolucionar" el estado del pago (retorna una nueva instancia)
    {
        if (monto < 0) monto = 0;
        if (MontoTotal < monto)
            throw new ArgumentException("El monto a pagar excede el monto pendiente.");
        return this with { MontoTotal = MontoTotal - monto };
    }

    public SaldoAFavor AgregarSaldo(decimal monto) // Método para "evolucionar" el estado del pago (retorna una nueva instancia)
    {
        if (monto < 0) monto = 0;
        return this with { MontoTotal = MontoTotal + monto };
    }
}