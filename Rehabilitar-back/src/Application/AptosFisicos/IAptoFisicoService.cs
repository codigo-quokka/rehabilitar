using ErrorOr;

namespace Application.AptosFisicos;

public interface IAptoFisicoService
{
    Task<ErrorOr<AptoFisicoResponse>> SubirAsync(Guid clienteId, Stream archivo, string nombreArchivo, string contentType);
    Task<ErrorOr<Success>> EvaluarAsync(Guid aptoFisicoId, Guid evaluadoPor, bool aprobado, string? motivoRechazo);
    Task<ErrorOr<AptoFisicoArchivoDto>> GetArchivoAsync(Guid aptoFisicoId, Guid usuarioId, string rol);
    Task<ErrorOr<List<AptoFisicoResponse>>> GetPendientesAsync();
    Task<ErrorOr<List<AptoFisicoResponse>>> GetMisAptosAsync(Guid clienteId);
}
