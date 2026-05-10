using Application.Salas.DTOs;

namespace Application.Salas;

public interface ISalaService
{
    Task<SalaDto> CrearSala(CrearSalaRequest request);
    Task<SalaDto> EditarSala(Guid id, EditarSalaRequest request);
    Task EliminarSala(Guid id);
    Task<SalaDto> ObtenerSalaPorId(Guid id);
    Task<IEnumerable<SalaDto>> ObtenerTodasLasSalas();
}