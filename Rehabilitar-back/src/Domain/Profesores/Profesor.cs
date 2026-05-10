using Domain.Actividades;

namespace Domain.Profesores;

public class Profesor
{
    public Guid UserId { get; private set;}
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