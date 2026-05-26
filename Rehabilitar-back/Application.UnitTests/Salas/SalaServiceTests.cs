using Application.Salas;
using Application.Salas.Requests;
using Application.Common.Interfaces;
using Domain.Salas;
using Moq;
using FluentAssertions;
using ErrorOr;

namespace Application.UnitTests.Salas;

public class SalaServiceTests
{
    private readonly Mock<ISalaRepository> _salaRepoMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly SalaService _sut;

    public SalaServiceTests()
    {
        _salaRepoMock = new Mock<ISalaRepository>();
        _uowMock = new Mock<IUnitOfWork>();

        _sut = new SalaService(
            _salaRepoMock.Object,
            _uowMock.Object);
    }

    [Fact]
    public async Task CrearSala_CuandoDatosSonValidos_DebeRetornarSuccess()
    {
        // Arrange
        var request = new CrearSalaRequest("Sala 1", 20, "Descripcion");
        _salaRepoMock.Setup(x => x.ExisteSalaConNombre(request.Nombre, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.CrearSala(request);

        // Assert
        result.IsError.Should().BeFalse();
        _salaRepoMock.Verify(x => x.Add(It.IsAny<Sala>()), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CrearSala_CuandoNombreDuplicado_DebeRetornarErrorConflict()
    {
        // Arrange
        var request = new CrearSalaRequest("Sala 1", 20, "Descripcion");
        _salaRepoMock.Setup(x => x.ExisteSalaConNombre(request.Nombre, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.CrearSala(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Conflict);
    }

    [Fact]
    public async Task EditarSala_CuandoDatosSonValidos_DebeRetornarSuccess()
    {
        // Arrange
        var id = Guid.NewGuid();
        var sala = Sala.Create("Sala 1", 20, "Descripcion");
        var request = new EditarSalaRequest("Sala 2", 30, "Nueva Descripcion", true);
        
        _salaRepoMock.Setup(x => x.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sala);
        _salaRepoMock.Setup(x => x.ExisteSalaConNombre(request.Nombre!, id))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.EditarSala(id, request);

        // Assert
        result.IsError.Should().BeFalse();
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task EditarSala_CuandoNombreDuplicado_DebeRetornarErrorConflict()
    {
        // Arrange
        var id = Guid.NewGuid();
        // Usamos reflexión para crear la sala con el ID específico y que coincida con el mock
        var sala = (Sala)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Sala));
        typeof(Sala).GetProperty("Id")?.SetValue(sala, id);
        typeof(Sala).GetProperty("Nombre")?.SetValue(sala, "Sala 1");
        
        var request = new EditarSalaRequest("Sala 2", 30, "Nueva Descripcion", true);
        
        _salaRepoMock.Setup(x => x.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sala);
        _salaRepoMock.Setup(x => x.ExisteSalaConNombre(request.Nombre!, id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.EditarSala(id, request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Conflict);
    }

    [Fact]
    public async Task EliminarSala_CuandoExiste_DebeRetornarDeleted()
    {
        // Arrange
        var id = Guid.NewGuid();
        var sala = Sala.Create("Sala 1", 20, "Descripcion");
        
        _salaRepoMock.Setup(x => x.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sala);

        // Act
        var result = await _sut.EliminarSala(id);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(Result.Deleted);
        _salaRepoMock.Verify(x => x.Remove(sala), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
