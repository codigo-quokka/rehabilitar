namespace Domain;

public class Reserva
{
    public Guid Id {get; init;}
    public User User {get; init;}

    #nullable disable
    public Reserva() { }
    #nullable enable

    public Reserva(User user)
    {
        Id = Guid.NewGuid();
        User = user;
    }
}