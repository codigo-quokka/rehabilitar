namespace Application.Suscripciones.DTOs;

public record CrearSuscripcionRequest(Guid ClienteId, Guid SerieId, int MesesDuracion = 1);
