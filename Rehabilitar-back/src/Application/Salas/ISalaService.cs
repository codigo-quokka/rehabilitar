using Application.Salas.Requests;
using Application.Salas.Responses;
using ErrorOr;

namespace Application.Salas;

public interface ISalaService
{
    Task<ErrorOr<SalaResponse>> CrearSala(CrearSalaRequest request, CancellationToken ct = default);
    Task<ErrorOr<SalaResponse>> EditarSala(Guid id, EditarSalaRequest request, CancellationToken ct = default);
    Task<ErrorOr<Deleted>> EliminarSala(Guid id, CancellationToken ct = default);
    Task<ErrorOr<SalaResponse>> ObtenerSalaPorId(Guid id, CancellationToken ct = default);
    Task<ErrorOr<IEnumerable<SalaResponse>>> ObtenerTodasLasSalas(CancellationToken ct = default);
}