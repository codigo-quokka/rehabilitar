using Application.Salas.DTOs;

namespace Application.Salas;

public interface ISalaService
{
    Task<SalaDto> CrearSala(SalaDto request);
    Task<SalaDto> EditarSala(SalaDto request);
    Task EliminarSala(Guid id);
    Task<SalaDto> ObtenerSalaPorId(Guid id);
    Task<IEnumerable<SalaDto>> ObtenerTodasLasSalas();
}