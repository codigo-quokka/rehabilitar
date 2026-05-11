using Domain.Actividades;

namespace Domain.Profesores;

public class Profesor
{
    public Guid UserId { get; private set;}
    public User User { get; private set; } // lo agrego solo pa que no me grite la IA y poder mergear
    public TipoEspecialidad Especialidad { get; private set; }

    public ICollection<Actividad>? ActividadesAsignadas { get; private set; }

    #nullable disable
    public Profesor() { }
    #nullable enable

    public Profesor(Guid userId, TipoEspecialidad especialidad)
    {
        UserId = userId;
        Especialidad = especialidad;
    }
}