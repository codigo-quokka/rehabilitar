namespace Domain.Notificaciones;

public class Notificacion
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime FechaCreacion { get; private set; }
    public string Titulo { get; private set; }
    public string Mensaje { get; private set; }
    public bool Leida { get; private set; }

    #nullable disable
    public Notificacion() { }
    #nullable enable

    private Notificacion(Guid userId, string titulo, string mensaje)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        FechaCreacion = DateTime.UtcNow;
        Titulo = titulo;
        Mensaje = mensaje;
        Leida = false;
    }

    public static Notificacion Create(Guid userId, string titulo, string mensaje)
    {
        if (!Validar(titulo))
            throw new ArgumentException("El título no puede estar vacío.");
        if (!Validar(mensaje))
            throw new ArgumentException("El mensaje no puede estar vacío.");
        return new Notificacion(userId, titulo, mensaje);
    }

    public void MarcarComoLeida()
    {
        Leida = true;
    }

    public void MarcarComoNoLeida()
    {
        Leida = false;
    }

    private static bool Validar(string texto)
    {
        return !string.IsNullOrWhiteSpace(texto);
    }
}
