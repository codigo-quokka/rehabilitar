using Application.AptosFisicos;
using Application.Clientes;
using Application.Common.Interfaces;
using Domain.AptosFisicos;
using Domain.Clientes;
using Domain;
using ErrorOr;
using FluentAssertions;
using Moq;

namespace Application.UnitTests.AptosFisicos;

public class AptoFisicoServiceTests
{
    private readonly Mock<IAptoFisicoRepository> _aptoFisicoRepoMock;
    private readonly Mock<IClienteRepository> _clienteRepoMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly AptoFisicoService _sut;

    public AptoFisicoServiceTests()
    {
        _aptoFisicoRepoMock = new Mock<IAptoFisicoRepository>();
        _clienteRepoMock = new Mock<IClienteRepository>();
        _uowMock = new Mock<IUnitOfWork>();
        _emailServiceMock = new Mock<IEmailService>();

        _sut = new AptoFisicoService(
            _aptoFisicoRepoMock.Object,
            _clienteRepoMock.Object,
            _uowMock.Object,
            _emailServiceMock.Object);
    }

    [Fact]
    public async Task EvaluarAsync_Aprobado_ReturnsSuccess()
    {
        // Arrange
        var aptoId = Guid.NewGuid();
        var evaluadorId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();
        
        var apto = (AptoFisico)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(AptoFisico));
        typeof(AptoFisico).GetProperty("Id")?.SetValue(apto, aptoId);
        typeof(AptoFisico).GetProperty("Estado")?.SetValue(apto, EstadoAptoFisico.Pendiente);
        
        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        var user = User.Create("Nombre", "Apellido", "email@test.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        typeof(Cliente).GetProperty("User")?.SetValue(cliente, user);
        typeof(AptoFisico).GetProperty("Cliente")?.SetValue(apto, cliente);
        
        _aptoFisicoRepoMock.Setup(x => x.GetByIdAsync(aptoId)).ReturnsAsync(apto);

        // Act
        var result = await _sut.EvaluarAsync(aptoId, evaluadorId, true, null);

        // Assert
        result.IsError.Should().BeFalse();
        _emailServiceMock.Verify(x => x.SendAptoFisicoAprobadoEmail(user.Email!), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task EvaluarAsync_Rechazado_ReturnsSuccess()
    {
        // Arrange
        var aptoId = Guid.NewGuid();
        var evaluadorId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();
        var motivo = "Motivo de rechazo";
        
        var apto = (AptoFisico)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(AptoFisico));
        typeof(AptoFisico).GetProperty("Id")?.SetValue(apto, aptoId);
        typeof(AptoFisico).GetProperty("Estado")?.SetValue(apto, EstadoAptoFisico.Pendiente);
        
        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        var user = User.Create("Nombre", "Apellido", "email@test.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        typeof(Cliente).GetProperty("User")?.SetValue(cliente, user);
        typeof(AptoFisico).GetProperty("Cliente")?.SetValue(apto, cliente);
        
        _aptoFisicoRepoMock.Setup(x => x.GetByIdAsync(aptoId)).ReturnsAsync(apto);

        // Act
        var result = await _sut.EvaluarAsync(aptoId, evaluadorId, false, motivo);

        // Assert
        result.IsError.Should().BeFalse();
        _emailServiceMock.Verify(x => x.SendAptoFisicoRechazadoEmail(user.Email!, motivo), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task EvaluarAsync_RechazadoSinMotivo_ReturnsValidationError()
    {
        // Arrange
        var aptoId = Guid.NewGuid();
        var evaluadorId = Guid.NewGuid();
        
        var apto = (AptoFisico)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(AptoFisico));
        typeof(AptoFisico).GetProperty("Id")?.SetValue(apto, aptoId);
        typeof(AptoFisico).GetProperty("Estado")?.SetValue(apto, EstadoAptoFisico.Pendiente);
        
        _aptoFisicoRepoMock.Setup(x => x.GetByIdAsync(aptoId)).ReturnsAsync(apto);

        // Act
        var result = await _sut.EvaluarAsync(aptoId, evaluadorId, false, null);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
    }
}