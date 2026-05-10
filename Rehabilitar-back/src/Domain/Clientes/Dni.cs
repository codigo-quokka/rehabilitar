using Domain.Exceptions;

namespace Domain.Clientes;

public record class Dni
{
    public string Valor { get; private set; }

    public Dni(string dni)
    {
        if (dni.Length < 7 || dni.Length > 8)
            throw new DomainException("El DNI debe contener entre 7 y 8 caracteres.");
        
        // verificar que los caracteres sean sólo dígitos.
        if (!dni.All(char.IsDigit))
            throw new DomainException("El DNI sólo debe contener caracteres numéricos.");

        Valor = dni;
    }

    public override string ToString()
    {
        return Valor;
    }
}