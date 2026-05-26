using Domain.Exceptions;
using Domain.AptosFisicos;

namespace Domain.Clientes;

public class Cliente
{
    public Guid UserId { get; private set; }

    public User User { get; private set; }
    public int RehabiliCoins {get; private set;}
    public int CancelacionesConsecutivas { get; private set; }
    public int InasistenciasConsecutivas { get; private set; }
    public decimal DescuentoProximaReserva { get; private set; }
    public SaldoAFavor SaldoAFavor { get; private set; }
    public bool AptoFisicoAprobado { get; private set;}
    public virtual AptoFisico? AptoFisico { get; private set; }

    #nullable disable
    private Cliente() { }
    #nullable enable

    private Cliente(Guid userId)
    {
        UserId = userId;
        AptoFisicoAprobado = false;
        SaldoAFavor = new SaldoAFavor(0m);
    }

    // factory
    public static Cliente Create(Guid userId, DateOnly fechaNacimiento, Dni dni, string? telefono = null)
    {
        return new Cliente(userId);
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
        SaldoAFavor = SaldoAFavor.AgregarSaldo(monto);
    }

    public void RegistrarPago(decimal monto)
    {
        SaldoAFavor = SaldoAFavor.RestarSaldo(monto);
    }
    
    public void AprobarAptoFisico()
    {
        AptoFisicoAprobado = true;
    }

    public void RechazarAptoFisico()
    {
        AptoFisicoAprobado = false;
    }

    public void ResetearCancelaciones()
    {
        CancelacionesConsecutivas = 0;
        DescuentoProximaReserva = 0m;
    }

    public void RegistrarCancelacion()
    {
        CancelacionesConsecutivas++;

        if (CancelacionesConsecutivas == 1)
        {
            DescuentoProximaReserva = 0.30m;
        }
        else if (CancelacionesConsecutivas == 2)
        {
            DescuentoProximaReserva = 0.20m;
        }
        else
        {
            DescuentoProximaReserva = 0m;
        }
    }

    public void RegistrarInasistencia()
    {
       InasistenciasConsecutivas++;
       if (InasistenciasConsecutivas == 3)
        {
            SuspenderCuenta();
        }
    }

    private void SuspenderCuenta()
    {
        User.Suspender();
    }

    public void ResetearInasistencias()
    {
        InasistenciasConsecutivas = 0;
    }
}