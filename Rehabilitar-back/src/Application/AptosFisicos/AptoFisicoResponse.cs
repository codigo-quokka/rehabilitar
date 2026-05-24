namespace Application.AptosFisicos;

public record AptoFisicoResponse(
    Guid Id,
    Guid ClienteId,
    string? ClienteNombre,
    string NombreArchivo,
    string ContentType,
    long Tamaño,
    string Estado,
    DateTime FechaSubida,
    DateTime? FechaEvaluacion,
    string? EvaluadoPorNombre,
    string? MotivoRechazo
);
