namespace Domain;
using Domain.Actividades;
using Domain.Enums;

public class Reserva
{
    public Guid Id {get; init;}
    public Guid UserId {get; init;}
    public User Cliente {get; init;} // Podría ser un objeto más específico que herede de User, para diferenciarlo de otros tipos de usuarios (administradores, profesores, etc.)
    public Guid ActividadId { get; init; }
    public EstadoDelPago EstadoDelPago {get; private set;} = EstadoDelPago.Pendiente; // Esto podría ser un objeto 
    public double? MontoPendiente { get; private set; }
    public EstadoDeReserva EstadoDeReserva { get; private set; } = EstadoDeReserva.Activa;

    #nullable disable
    public Reserva() { }
    #nullable enable

    public Reserva(User cliente, Actividad actividad, EstadoDelPago estadoDelPago = EstadoDelPago.Pendiente, double? montoPendiente = null, EstadoDeReserva estadoDeReserva = EstadoDeReserva.Activa)
    {
        Id = Guid.NewGuid();
        Cliente = cliente;
        UserId = cliente.Id;
        ActividadId = actividad.Id;
        EstadoDelPago = estadoDelPago;
        MontoPendiente = EstadoDelPago == EstadoDelPago.Pendiente ? montoPendiente : null;
        EstadoDeReserva = estadoDeReserva;
    }
}