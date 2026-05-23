using Domain.Exceptions;

namespace Domain.Clientes;

public class Cliente
{
    public Guid UserId { get; private set; }
    public DateOnly FechaNacimiento { get; private set; }
    public Dni Dni { get; private set; }
    public string? Telefono { get; private set; }

    public User User { get; private set; }
    public int RehabiliCoins {get; private set;}
    public SaldoAFavor SaldoAFavor { get; private set; }
    public bool AptoFisicoAprobado { get; private set;}

    #nullable disable
    private Cliente() { }
    #nullable enable

    private Cliente(Guid userId, DateOnly fechaNacimiento, Dni dni, string? telefono = null)
    {
        UserId = userId;
        FechaNacimiento = fechaNacimiento;
        Dni = dni;
        Telefono = telefono;
        AptoFisicoAprobado = false;
    }

    // factory
    public static Cliente Create(Guid userId, DateOnly fechaNacimiento, Dni dni, string? telefono = null)
    {
        ValidarMayorDeEdad(fechaNacimiento);
        return new Cliente(userId, fechaNacimiento, dni, telefono);
    }

    private static void ValidarMayorDeEdad(DateOnly fechaNac)
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        if (fechaNac.AddYears(18) > hoy)
        {
            throw new DomainException("Debe ser mayor de edad para registrarse en el sitio.");
        }
    }

    public void RecibirRehabilicoin()
    {
        RehabiliCoins++;
    }

    public void CanjearRehabilicoin()
    {
        if (RehabiliCoins <= 0)
        {
            throw new DomainException("No tiene RehabiliCoins para canjear.");
        }
        RehabiliCoins--;
    }

    public void Reembolsar(decimal monto)
    {
        SaldoAFavor.AgregarSaldo(monto);
    }

    public void RegistrarPago(decimal monto)
    {
        SaldoAFavor.RestarSaldo(monto);
    }
    
    public void AprobarAptoFisico()
    {
        AptoFisicoAprobado = true;
    }

    public void RechazarAptoFisico()
    {
        AptoFisicoAprobado = false;
    }
}