using Application.Actividades;
using Application.Actividades.DTOs;
using Application.Common.Interfaces;
using Application.Salas;
using Application.Profesores;
using Application.Clientes;
using Application.Pagos;
using Domain.Actividades;
using Domain.Salas;
using Domain.Profesores;
using Domain.Clientes;
using Domain.Reservas;
using Moq;
using FluentAssertions;
using ErrorOr;

namespace Application.UnitTests.Actividades;

public class ActividadServiceTests
{
    private readonly Mock<IActividadRepository> _actividadRepoMock;
    private readonly Mock<ISalaRepository> _salaRepoMock;
    private readonly Mock<IProfesorRepository> _profesorRepoMock;
    private readonly Mock<IClienteRepository> _clienteRepoMock;
    private readonly Mock<IIntencionPagoRepository> _intencionPagoRepoMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly ActividadService _sut;

    public ActividadServiceTests()
    {
        _actividadRepoMock = new Mock<IActividadRepository>();
        _salaRepoMock = new Mock<ISalaRepository>();
        _profesorRepoMock = new Mock<IProfesorRepository>();
        _clienteRepoMock = new Mock<IClienteRepository>();
        _intencionPagoRepoMock = new Mock<IIntencionPagoRepository>();
        _uowMock = new Mock<IUnitOfWork>();

        _sut = new ActividadService(
            _actividadRepoMock.Object,
            _salaRepoMock.Object,
            _profesorRepoMock.Object,
            _clienteRepoMock.Object,
            _intencionPagoRepoMock.Object,
            _uowMock.Object);
    }

    [Fact]
    public async Task CrearActividad_CuandoDatosSonValidos_DebeRetornarSuccess()
    {
        // Arrange
        var salaId = Guid.NewGuid();
        var profesorId = Guid.NewGuid();
        var request = new CrearActividadRequest("Actividad 1", "Desc", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Recurrente, EstadoActividad.Aprobada, DateTime.Now.AddDays(1), 10, salaId, profesorId, null);
        
        var sala = Sala.Create("Sala 1", 20, "Desc");
        typeof(Sala).GetProperty("Id")?.SetValue(sala, salaId);
        
        var profesor = (Profesor)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Profesor));
        typeof(Profesor).GetProperty("Especialidad")?.SetValue(profesor, TipoEspecialidad.TrenSuperior);
        
        _salaRepoMock.Setup(x => x.GetByIdAsync(salaId, It.IsAny<CancellationToken>())).ReturnsAsync(sala);
        _profesorRepoMock.Setup(x => x.GetByIdAsync(profesorId, It.IsAny<CancellationToken>())).ReturnsAsync(profesor);
        _actividadRepoMock.Setup(x => x.ExisteActividadSuperpuestaEnSalaAsync(salaId, request.FechaYHora, null, It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _actividadRepoMock.Setup(x => x.ExisteActividadSuperpuestaEnProfesorAsync(It.IsAny<Guid>(), request.FechaYHora, null, It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        // Act
        var result = await _sut.CrearActividad(request);

        // Assert
        result.IsError.Should().BeFalse();
        _actividadRepoMock.Verify(x => x.Add(It.IsAny<Actividad>()), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CrearActividad_CuandoCupoExcedeCapacidad_DebeRetornarErrorValidation()
    {
        // Arrange
        var salaId = Guid.NewGuid();
        var request = new CrearActividadRequest("Actividad 1", "Desc", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Recurrente, EstadoActividad.Aprobada, DateTime.Now.AddDays(1), 20, salaId, null, null);
        
        var sala = Sala.Create("Sala 1", 10, "Desc");
        typeof(Sala).GetProperty("Id")?.SetValue(sala, salaId);
        
        _salaRepoMock.Setup(x => x.GetByIdAsync(salaId, It.IsAny<CancellationToken>())).ReturnsAsync(sala);

        // Act
        var result = await _sut.CrearActividad(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
    }

    [Fact]
    public async Task CrearActividad_CuandoEspecialidadIncorrecta_DebeRetornarErrorValidation()
    {
        // Arrange
        var salaId = Guid.NewGuid();
        var profesorId = Guid.NewGuid();
        var request = new CrearActividadRequest("Actividad 1", "Desc", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Recurrente, EstadoActividad.Aprobada, DateTime.Now.AddDays(1), 10, salaId, profesorId, null);
        
        var sala = Sala.Create("Sala 1", 20, "Desc");
        typeof(Sala).GetProperty("Id")?.SetValue(sala, salaId);
        
        var profesor = (Profesor)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Profesor));
        typeof(Profesor).GetProperty("Especialidad")?.SetValue(profesor, TipoEspecialidad.TrenInferior);
        
        _salaRepoMock.Setup(x => x.GetByIdAsync(salaId, It.IsAny<CancellationToken>())).ReturnsAsync(sala);
        _profesorRepoMock.Setup(x => x.GetByIdAsync(profesorId, It.IsAny<CancellationToken>())).ReturnsAsync(profesor);

        // Act
        var result = await _sut.CrearActividad(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
    }

    [Fact]
    public async Task CrearActividad_CuandoSalaOcupada_DebeRetornarErrorConflict()
    {
        // Arrange
        var salaId = Guid.NewGuid();
        var request = new CrearActividadRequest("Actividad 1", "Desc", TipoEspecialidad.TrenSuperior, FrecuenciaActividad.Recurrente, EstadoActividad.Aprobada, DateTime.Now.AddDays(1), 10, salaId, null, null);
        
        var sala = Sala.Create("Sala 1", 20, "Desc");
        typeof(Sala).GetProperty("Id")?.SetValue(sala, salaId);
        
        _salaRepoMock.Setup(x => x.GetByIdAsync(salaId, It.IsAny<CancellationToken>())).ReturnsAsync(sala);
        _actividadRepoMock.Setup(x => x.ExisteActividadSuperpuestaEnSalaAsync(salaId, request.FechaYHora, null, It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        // Act
        var result = await _sut.CrearActividad(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Conflict);
    }

    [Fact]
    public async Task CancelarActividad_CuandoExiste_DebeRetornarDeleted()
    {
        // Arrange
        var id = Guid.NewGuid();
        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, new List<Reserva>());
        
        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(actividad);

        // Act
        var result = await _sut.CancelarActividad(id);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(Result.Deleted);
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoverProfesorActividad_CuandoDatosSonValidos_DebeRetornarSuccess()
    {
        // Arrange
        var id = Guid.NewGuid();
        var profesorId = Guid.NewGuid();
        var request = new RemoverProfesorRequest(profesorId);
        
        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("ProfesorId")?.SetValue(actividad, profesorId);
        typeof(Actividad).GetProperty("Estado")?.SetValue(actividad, EstadoActividad.Aprobada);
        
        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(actividad);

        // Act
        var result = await _sut.RemoverProfesorActividad(id, request);

        // Assert
        result.IsError.Should().BeFalse();
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoverProfesorActividad_CuandoActividadFinalizada_DebeRetornarErrorValidation()
    {
        // Arrange
        var id = Guid.NewGuid();
        var profesorId = Guid.NewGuid();
        var request = new RemoverProfesorRequest(profesorId);
        
        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("ProfesorId")?.SetValue(actividad, profesorId);
        typeof(Actividad).GetProperty("Estado")?.SetValue(actividad, EstadoActividad.Finalizada);
        
        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(actividad);

        // Act
        var result = await _sut.RemoverProfesorActividad(id, request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
    }
}
