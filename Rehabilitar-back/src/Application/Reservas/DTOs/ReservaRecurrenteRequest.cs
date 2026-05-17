using Domain.Actividades;
using Domain.Enums;

namespace Application.Reservas.DTOs;

public record class ReservaRecurrenteRequest(
    ICollection<Actividad> Actividades,
    Guid ClienteId,
    TipoCliente TipoCliente
    );
