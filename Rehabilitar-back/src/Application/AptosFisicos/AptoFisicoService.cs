using Application.Clientes;
using Application.Common.Interfaces;
using Domain.AptosFisicos;
using ErrorOr;

namespace Application.AptosFisicos;

public class AptoFisicoService : IAptoFisicoService
{
    private readonly IAptoFisicoRepository _aptoFisicoRepository;
    private readonly IClienteRepository _clienteRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;

    private static readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".pdf" };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    public AptoFisicoService(IAptoFisicoRepository aptoFisicoRepository, IClienteRepository clienteRepository, IUnitOfWork unitOfWork, IEmailService emailService)
    {
        _aptoFisicoRepository = aptoFisicoRepository;
        _clienteRepository = clienteRepository;
        _unitOfWork = unitOfWork;
        _emailService = emailService;
    }

    public async Task<ErrorOr<AptoFisicoResponse>> SubirAsync(Guid clienteId, Stream archivoStream, string nombreArchivo, string contentType)
    {
        // Validaciones
        var extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();
        if (!_allowedExtensions.Contains(extension))
        {
            return Error.Validation(code: "AptoFisico.InvalidFileExtension", description: "Solo se permiten archivos JPG, JPEG, PNG y PDF.");
        }

        if (archivoStream.Length == 0)
        {
            return Error.Validation(code: "AptoFisico.EmptyFile", description: "El archivo no puede estar vacío.");
        }

        if (archivoStream.Length > MaxFileSize)
        {
            return Error.Validation(code: "AptoFisico.FileTooLarge", description: "El tamaño máximo permitido para el archivo es de 10 MB.");
        }

        var cliente = await _clienteRepository.GetByIdAsync(clienteId);
        if (cliente is null)
        {
            return Error.NotFound(code: "AptoFisico.ClientNotFound", description: "Cliente no encontrado.");
        }

        // Leer el archivo a memoria
        byte[] archivoBytes;
        using (var memoryStream = new MemoryStream())
        {
            await archivoStream.CopyToAsync(memoryStream);
            archivoBytes = memoryStream.ToArray();
        }

        // Verificar si ya hay un apto pendiente para reemplazar
        var aptosExistentes = await _aptoFisicoRepository.GetByClienteIdAsync(clienteId);
        var pendiente = aptosExistentes.FirstOrDefault(a => a.Estado == EstadoAptoFisico.Pendiente);

        if (pendiente != null)
        {
            // Reemplazar el archivo del apto pendiente existente
            pendiente.ReemplazarArchivo(nombreArchivo, contentType, archivoBytes, archivoBytes.Length);
            await _unitOfWork.SaveChangesAsync();
            return MapToResponse(pendiente);
        }

        // Si no hay pendiente, crear uno nuevo
        var aptoFisico = new AptoFisico(clienteId, nombreArchivo, contentType, archivoBytes, archivoBytes.Length);
        _aptoFisicoRepository.Add(aptoFisico);
        cliente.RechazarAptoFisico(); // Si se sube un nuevo apto, el cliente no tiene un apto aprobado hasta que se evalúe el nuevo
        await _unitOfWork.SaveChangesAsync();
        return MapToResponse(aptoFisico);
    }

    public async Task<ErrorOr<Success>> EvaluarAsync(Guid aptoFisicoId, Guid evaluadoPor, bool aprobado, string? motivoRechazo)
    {
        var aptoFisico = await _aptoFisicoRepository.GetByIdAsync(aptoFisicoId);
        if (aptoFisico is null)
        {
            return Error.NotFound(code: "AptoFisico.AptoFisicoNotFound", description: "Apto físico no encontrado.");
        }

        if (aptoFisico.Estado != EstadoAptoFisico.Pendiente)
        {
            return Error.Conflict(code: "AptoFisico.AptoFisicoAlreadyEvaluated", description: "El apto físico ya ha sido evaluado.");
        }

        if (aprobado)
        {
            aptoFisico.Aprobar(evaluadoPor);
            aptoFisico.Cliente.AprobarAptoFisico(); // Actualiza el estado del cliente
            await _emailService.SendAptoFisicoAprobadoEmail(aptoFisico.Cliente.User.Email!);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(motivoRechazo))
            {
                return Error.Validation(code: "AptoFisico.RejectionReasonRequired", description: "El motivo de rechazo es requerido.");
            }
            aptoFisico.Rechazar(evaluadoPor, motivoRechazo);
            // Si se rechaza, el apto fisico del cliente no esta aprobado
            aptoFisico.Cliente.RechazarAptoFisico();
            await _emailService.SendAptoFisicoRechazadoEmail(aptoFisico.Cliente.User.Email!, motivoRechazo);
        }

        await _unitOfWork.SaveChangesAsync();

        return Result.Success;
    }

    public async Task<ErrorOr<AptoFisicoArchivoDto>> GetArchivoAsync(Guid aptoFisicoId, Guid usuarioId, string rol)
    {
        var aptoFisico = await _aptoFisicoRepository.GetByIdAsync(aptoFisicoId);
        if (aptoFisico is null)
        {
            return Error.NotFound(code: "AptoFisico.AptoFisicoNotFound", description: "Apto físico no encontrado.");
        }

        // Solo Admin, Recepción o el propio cliente pueden descargar el archivo
        if (rol != "Administrador" && rol != "Recepción" && aptoFisico.Cliente.UserId != usuarioId)
        {
            return Error.Forbidden(code: "AptoFisico.UnauthorizedAccess", description: "No tiene permiso para acceder a este archivo.");
        }

        return new AptoFisicoArchivoDto(aptoFisico.Archivo, aptoFisico.ContentType, aptoFisico.NombreArchivo);
    }

    public async Task<ErrorOr<List<AptoFisicoResponse>>> GetPendientesAsync()
    {
        var aptos = await _aptoFisicoRepository.GetPendientesAsync();
        return aptos.Select(MapToResponse).ToList();
    }

    public async Task<ErrorOr<List<AptoFisicoResponse>>> GetMisAptosAsync(Guid clienteId)
    {
        var aptos = await _aptoFisicoRepository.GetByClienteIdAsync(clienteId);
        return aptos.Select(MapToResponse).ToList();
    }

    public async Task<ErrorOr<List<AptoFisicoResponse>>> GetAllAsync()
    {
        var aptos = await _aptoFisicoRepository.GetUltimoPorClienteAsync();
        return aptos.Select(MapToResponse).ToList();
    }

    private AptoFisicoResponse MapToResponse(AptoFisico aptoFisico)
    {
        return new AptoFisicoResponse(
            aptoFisico.Id,
            aptoFisico.ClienteId,
            $"{aptoFisico.Cliente?.User?.FirstName} {aptoFisico.Cliente?.User?.LastName}",
            aptoFisico.NombreArchivo,
            aptoFisico.ContentType,
            aptoFisico.Tamaño,
            aptoFisico.Estado.ToString(),
            aptoFisico.FechaSubida,
            aptoFisico.FechaEvaluacion,
            $"{aptoFisico.Evaluador?.FirstName} {aptoFisico.Evaluador?.LastName}",
            aptoFisico.MotivoRechazo
        );
    }
}
