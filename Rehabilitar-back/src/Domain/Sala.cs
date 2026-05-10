using Domain.Actividades;

namespace Domain;

public class Sala
{
    public Guid Id {get; private set;}
    public string Nombre {get; private set;} = "";
    public int Capacidad {get; private set;}

    public List<Actividad> Actividades { get; private set; } = new();

    #nullable enable
    public Sala() {}
    #nullable disable

    public Sala(string nombre, int capacidad)
    {
        Id = Guid.NewGuid();
        CambiarNombre(nombre);
        CambiarCapacidad(capacidad);
    }

    public void CambiarCapacidad(int nuevaCapacidad)
    {
        if (nuevaCapacidad < 0)
            throw new ArgumentException("La capacidad de la sala no puede ser negativa.");
        Capacidad = nuevaCapacidad;
    }

    public void CambiarNombre(string nuevoNombre)
    {
        if (string.IsNullOrWhiteSpace(nuevoNombre))
            throw new ArgumentException("El nombre de la sala no puede estar vacío.");
        Nombre = nuevoNombre;
    }

    public void AgregarActividad(Actividad actividad)
    {
        if (actividad == null)
            throw new ArgumentNullException(nameof(actividad));
        if (actividad.SalaId != Id)
            throw new ArgumentException("La actividad no pertenece a esta sala.");
        Actividades.Add(actividad);
    }

    public void EliminarActividad(Guid actividadId)
    {
        var actividad = Actividades.FirstOrDefault(a => a.Id == actividadId);
        if (actividad == null)
            throw new ArgumentException("La actividad no existe en esta sala.");
        Actividades.Remove(actividad);
    }
}