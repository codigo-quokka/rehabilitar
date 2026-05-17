namespace Application.Auth.DTOs;

public record ParsedDniResponse(
    bool IsValidId,
    string? FirstName,
    string? LastName,
    string? DniNumber,
    string? FechaNacimiento,
    string? ErrorMessage,
    string? ScanMethod = null
);
