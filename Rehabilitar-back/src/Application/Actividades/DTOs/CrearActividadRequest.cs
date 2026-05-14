namespace Application.Actividades.DTOs;

using Domain.Actividades;
using Domain.Profesores;

public record CrearActividadRequest(
    string Nombre,
    string Descripcion,
    TipoEspecialidad Tipo,
    FrecuenciaActividad Frecuencia,
    EstadoActividad Estado, // Por defecto se crea como activa, pero se puede especificar otro estado si es necesario
    DateTime FechaYHora,
    int CupoMaximo,
    Guid SalaId,
    Guid? ProfesorId = null, // El profesor es opcional, ya que puede haber actividades sin profesor asignado
    Guid? SerieId = null // Solo se utiliza para actividades recurrentes, para identificar a qué serie pertenecen
);