using Application.Auth.DTOs;

namespace Application.Common.Interfaces;

public interface IDocumentScannerService
{
    Task<ParsedDniResponse> ScanDniAsync(Stream imageStream);
}
