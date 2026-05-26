using Application.Suscripciones;
using Application.Clientes;
using Application.Common.Interfaces;
using Domain.Clientes;
using Moq;
using FluentAssertions;
using ErrorOr;

namespace Application.UnitTests.Suscripciones;

public class SuscripcionServiceTests
{
    private readonly Mock<ISuscripcionRepository> _suscripcionRepoMock;
    private readonly Mock<IClienteRepository> _clienteRepoMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly SuscripcionService _sut;

    public SuscripcionServiceTests()
    {
        _suscripcionRepoMock = new Mock<ISuscripcionRepository>();
        _clienteRepoMock = new Mock<IClienteRepository>();
        _uowMock = new Mock<IUnitOfWork>();

        _sut = new SuscripcionService(
            _suscripcionRepoMock.Object,
            _clienteRepoMock.Object,
            _uowMock.Object);
    }

    [Fact]
    public async Task SuscribirAsync_CuandoTodoEsCorrecto_DebeRetornarSuccess()
    {
        // Arrange
        var clienteId = Guid.NewGuid();
        var serieId = Guid.NewGuid();

        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        typeof(Cliente).GetProperty("AptoFisicoAprobado")?.SetValue(cliente, true);

        _clienteRepoMock.Setup(x => x.GetByIdAsync(clienteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cliente);

        _suscripcionRepoMock.Setup(x => x.GetActivaAsync(clienteId, serieId))
            .ReturnsAsync((SuscripcionAbonado?)null);

        // Act
        var result = await _sut.SuscribirAsync(clienteId, serieId);

        // Assert
        result.IsError.Should().BeFalse();
        _suscripcionRepoMock.Verify(x => x.AddAsync(It.IsAny<SuscripcionAbonado>()), Times.Once);
    }

    [Fact]
    public async Task SuscribirAsync_CuandoAptoFisicoNoAprobado_DebeRetornarError()
    {
        // Arrange
        var clienteId = Guid.NewGuid();
        var serieId = Guid.NewGuid();

        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        typeof(Cliente).GetProperty("AptoFisicoAprobado")?.SetValue(cliente, false);

        _clienteRepoMock.Setup(x => x.GetByIdAsync(clienteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cliente);

        // Act
        var result = await _sut.SuscribirAsync(clienteId, serieId);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Forbidden);
    }

    [Fact]
    public async Task SuscribirAsync_CuandoYaEstaSuscrito_DebeRetornarError()
    {
        // Arrange
        var clienteId = Guid.NewGuid();
        var serieId = Guid.NewGuid();

        var suscripcion = (SuscripcionAbonado)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(SuscripcionAbonado));

        var cliente = Cliente.Create(Guid.NewGuid(), DateOnly.FromDateTime(DateTime.Now.AddYears(-20)), new Dni("12345678"), null);
        cliente.AprobarAptoFisico();
        _clienteRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(cliente);

        _suscripcionRepoMock.Setup(x => x.GetActivaAsync(clienteId, serieId))
            .ReturnsAsync(suscripcion);

        // Act
        var result = await _sut.SuscribirAsync(clienteId, serieId);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Conflict);
    }

    [Fact]
    public async Task CancelarSuscripcionAsync_CuandoExiste_DebeCambiarEstadoACancelada()
    {
        // Arrange
        var suscripcionId = Guid.NewGuid();
        var suscripcion = (SuscripcionAbonado)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(SuscripcionAbonado));
        
        _suscripcionRepoMock.Setup(x => x.GetByIdAsync(suscripcionId))
            .ReturnsAsync(suscripcion);

        // Act
        var result = await _sut.CancelarSuscripcionAsync(suscripcionId);

        // Assert
        result.IsError.Should().BeFalse();
        _suscripcionRepoMock.Verify(x => x.UpdateAsync(It.IsAny<SuscripcionAbonado>()), Times.Once);
    }
}
