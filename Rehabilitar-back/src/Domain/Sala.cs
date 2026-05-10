using Domain.Actividades;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain;

public class Sala
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = "";
    public int Capacidad { get; private set; }
    public string? Descripcion { get; private set; }
    public bool Activo { get; private set; } = true;

    [NotMapped]
    public List<Actividad> Actividades { get; private set; } = new();

#nullable disable
    public Sala() { }
#nullable enable

    public Sala(string nombre, int capacidad, string? descripcion = null)
    {
        Id = Guid.NewGuid();
        CambiarNombre(nombre);
        CambiarCapacidad(capacidad);
        Descripcion = descripcion;
        Activo = true;
    }

    public void CambiarNombre(string nuevoNombre)
    {
        if (string.IsNullOrWhiteSpace(nuevoNombre))
            throw new ArgumentException("El nombre de la sala no puede estar vacío.");
        Nombre = nuevoNombre;
    }

    public void CambiarCapacidad(int nuevaCapacidad)
    {
        if (nuevaCapacidad < 0)
            throw new ArgumentException("La capacidad de la sala no puede ser negativa.");
        Capacidad = nuevaCapacidad;
    }

    public void CambiarDescripcion(string? descripcion)
    {
        Descripcion = descripcion;
    }

    public void Activar()
    {
        Activo = true;
    }

    public void Desactivar()
    {
        Activo = false;
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