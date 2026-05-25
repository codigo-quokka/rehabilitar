using Application.Common.Interfaces;
using Application.Salas.Requests;
using Application.Salas.Responses;
using Domain.Salas;
using ErrorOr;

namespace Application.Salas;

public class SalaService : ISalaService
{
    private readonly ISalaRepository _repo;
    private readonly IUnitOfWork _uow;

    public SalaService(ISalaRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<ErrorOr<SalaResponse>> CrearSala(CrearSalaRequest request, CancellationToken ct = default)
    {
        if (await _repo.ExisteSalaConNombre(request.Nombre))
            return Error.Conflict($"Ya existe una sala con el nombre \"{request.Nombre}\"");

        var sala = Sala.Create(request.Nombre, request.Capacidad, request.Descripcion);
        _repo.Add(sala);
        await _uow.SaveChangesAsync(ct);

        return MapToDto(sala);
    }

    public async Task<ErrorOr<SalaResponse>> EditarSala(Guid id, EditarSalaRequest request, CancellationToken ct = default)
    {
        var sala = await _repo.GetByIdAsync(id, ct);
        if (sala == null)
            return Error.NotFound("Sala no encontrada.");

        if (request.Nombre != null)
        {
            if (await _repo.ExisteSalaConNombre(request.Nombre, sala.Id)) // se envía el id de la sala a modificar para excluirla de la query.
                return Error.Conflict("Sala.NombreDuplicado", $"Ya existe una sala con el nombre \"{request.Nombre}\"");
            sala.CambiarNombre(request.Nombre);
        }
        if (request.Capacidad.HasValue)
            sala.CambiarCapacidad(request.Capacidad.Value);
        if (request.Descripcion != null)
            sala.CambiarDescripcion(request.Descripcion);
        if (request.Activo.HasValue)
        {
            if (request.Activo.Value)
                sala.Activar();
            else
                sala.Desactivar();
        }

        await _uow.SaveChangesAsync(ct);
        return MapToDto(sala);
    }

    public async Task<ErrorOr<Deleted>> EliminarSala(Guid id, CancellationToken ct = default)
    {
        var sala = await _repo.GetByIdAsync(id, ct);
        if (sala == null)
            return Error.NotFound("Sala no encontrada.");

        _repo.Remove(sala);
        await _uow.SaveChangesAsync(ct);

        return Result.Deleted;
    }

    public async Task<ErrorOr<SalaResponse>> ObtenerSalaPorId(Guid id, CancellationToken ct = default)
    {
        var sala = await _repo.GetByIdAsync(id, ct);
        
        if (sala == null)
            return Error.NotFound("Sala no encontrada.");

        return MapToDto(sala);
    }

    public async Task<ErrorOr<IEnumerable<SalaResponse>>> ObtenerTodasLasSalas(CancellationToken ct = default)
    {
        var salas = await _repo.GetAllAsync(ct);
        return salas.Select(MapToDto).ToList();
    }

    private static SalaResponse MapToDto(Sala sala) =>
        new(sala.Id, sala.Nombre, sala.Capacidad, sala.Descripcion, sala.Activo);
}