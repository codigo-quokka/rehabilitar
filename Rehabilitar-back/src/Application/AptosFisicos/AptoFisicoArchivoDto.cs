namespace Application.AptosFisicos;

public record AptoFisicoArchivoDto(
    byte[] Archivo,
    string ContentType,
    string NombreArchivo
);
