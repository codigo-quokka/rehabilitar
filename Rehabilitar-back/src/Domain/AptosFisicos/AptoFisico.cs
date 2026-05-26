using Domain.Clientes;
using Domain;

namespace Domain.AptosFisicos;

public class AptoFisico
{
    // Constructor vacío para EF
    #nullable disable
    private AptoFisico() { }
    #nullable enable
    
    public AptoFisico(Guid clienteId, string nombreArchivo, string contentType, byte[] archivo, long tamaño)
    {
        Id = Guid.NewGuid();
        ClienteId = clienteId;
        NombreArchivo = nombreArchivo;
        ContentType = contentType;
        Archivo = archivo;
        Tamaño = tamaño;
        Estado = EstadoAptoFisico.Pendiente;
        FechaSubida = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid ClienteId { get; private set; }
    public string NombreArchivo { get; private set; }
    public string ContentType { get; private set; }
    public byte[] Archivo { get; private set; }
    public long Tamaño { get; private set; }
    public EstadoAptoFisico Estado { get; private set; }
    public DateTime FechaSubida { get; private set; }
    public DateTime? FechaEvaluacion { get; private set; }
    public Guid? EvaluadoPor { get; private set; }
    public string? MotivoRechazo { get; private set; }

    // Navigation properties
    public virtual Cliente Cliente { get; private set; } = null!;
    public virtual User? Evaluador { get; private set; }

    public void Aprobar(Guid evaluadoPor)
    {
        if (Estado != EstadoAptoFisico.Pendiente)
        {
            throw new InvalidOperationException("Solo se puede aprobar un apto físico pendiente.");
        }
        Estado = EstadoAptoFisico.Aprobado;
        FechaEvaluacion = DateTime.UtcNow;
        EvaluadoPor = evaluadoPor;
    }

    public void Rechazar(Guid evaluadoPor, string motivo)
    {
        if (Estado != EstadoAptoFisico.Pendiente)
        {
            throw new InvalidOperationException("Solo se puede rechazar un apto físico pendiente.");
        }
        if (string.IsNullOrWhiteSpace(motivo))
        {
            throw new ArgumentException("El motivo de rechazo no puede estar vacío.", nameof(motivo));
        }
        Estado = EstadoAptoFisico.Rechazado;
        FechaEvaluacion = DateTime.UtcNow;
        EvaluadoPor = evaluadoPor;
        MotivoRechazo = motivo;
    }

    public void ReemplazarArchivo(string nombreArchivo, string contentType, byte[] archivo, long tamaño)
    {
        if (Estado != EstadoAptoFisico.Pendiente)
        {
            throw new InvalidOperationException("Solo se puede reemplazar el archivo de un apto físico pendiente.");
        }
        NombreArchivo = nombreArchivo;
        ContentType = contentType;
        Archivo = archivo;
        Tamaño = tamaño;
        FechaSubida = DateTime.UtcNow;
    }
}
