using Application.Common.Interfaces;
using Application.Clientes;
using Application.Profesores;
using Application.Usuarios;
using Application.Usuarios.Requests;
using Domain;
using Domain.Profesores;
using ErrorOr;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace Application.UnitTests.Usuarios;

public class UsuarioServiceTests
{
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<RoleManager<Role>> _roleManagerMock;
    private readonly Mock<IUsuarioRepository> _usuarioRepoMock;
    private readonly Mock<IClienteRepository> _clienteRepoMock;
    private readonly Mock<IProfesorRepository> _profesorRepoMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly UsuarioService _sut;

    public UsuarioServiceTests()
    {
        var userStoreMock = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(userStoreMock.Object, null, null, null, null, null, null, null, null);
        
        var roleStoreMock = new Mock<IRoleStore<Role>>();
        _roleManagerMock = new Mock<RoleManager<Role>>(roleStoreMock.Object, null, null, null, null);
        
        _usuarioRepoMock = new Mock<IUsuarioRepository>();
        _clienteRepoMock = new Mock<IClienteRepository>();
        _profesorRepoMock = new Mock<IProfesorRepository>();
        _uowMock = new Mock<IUnitOfWork>();
        _emailServiceMock = new Mock<IEmailService>();

        _sut = new UsuarioService(
            _userManagerMock.Object,
            _roleManagerMock.Object,
            _usuarioRepoMock.Object,
            _clienteRepoMock.Object,
            _profesorRepoMock.Object,
            _uowMock.Object,
            _emailServiceMock.Object);
    }

    [Fact]
    public async Task CreateAsync_Recepcionista_ReturnsSuccess()
    {
        // Arrange
        var request = new CrearUsuarioRequest
        {
            Nombre = "Nombre",
            Apellido = "Apellido",
            Email = "email@test.com",
            Dni = "12345678",
            Rol = "Recepcionista",
            Especialidad = null
        };
        
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        
        _userManagerMock.Setup(x => x.GetRolesAsync(It.IsAny<User>()))
            .ReturnsAsync(new List<string> { "Recepcionista" });
        
        _roleManagerMock.Setup(x => x.RoleExistsAsync("Recepcionista"))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.IsError.Should().BeFalse();
        _userManagerMock.Verify(x => x.AddToRoleAsync(It.IsAny<User>(), "Recepcionista"), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_Profesor_ReturnsSuccess()
    {
        // Arrange
        var request = new CrearUsuarioRequest
        {
            Nombre = "Nombre",
            Apellido = "Apellido",
            Email = "email@test.com",
            Dni = "12345678",
            Rol = "Profesor",
            Especialidad = "TrenSuperior"
        };
        
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        
        _userManagerMock.Setup(x => x.GetRolesAsync(It.IsAny<User>()))
            .ReturnsAsync(new List<string> { "Profesor" });
        
        _roleManagerMock.Setup(x => x.RoleExistsAsync("Profesor"))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.IsError.Should().BeFalse();
        _profesorRepoMock.Verify(x => x.Add(It.IsAny<Profesor>()), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_EmailInUse_ReturnsError()
    {
        // Arrange
        var request = new CrearUsuarioRequest
        {
            Nombre = "Nombre",
            Apellido = "Apellido",
            Email = "email@test.com",
            Dni = "12345678",
            Rol = "Recepcionista",
            Especialidad = null
        };
        
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Email already in use" }));

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
    }

    [Fact]
    public async Task SuspenderAsync_Success()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = User.Create("Nombre", "Apellido", "email@test.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        typeof(User).GetProperty("Id")?.SetValue(user, userId);
        
        _userManagerMock.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync(user);

        // Act
        var result = await _sut.SuspenderAsync(userId);

        // Assert
        result.IsError.Should().BeFalse();
        _userManagerMock.Verify(x => x.SetLockoutEnabledAsync(user, true), Times.Once);
        _userManagerMock.Verify(x => x.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue), Times.Once);
    }

    [Fact]
    public async Task ReactivarAsync_Success()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = User.Create("Nombre", "Apellido", "email@test.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        typeof(User).GetProperty("Id")?.SetValue(user, userId);
        
        _userManagerMock.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync(user);

        // Act
        var result = await _sut.ReactivarAsync(userId);

        // Assert
        result.IsError.Should().BeFalse();
        _userManagerMock.Verify(x => x.SetLockoutEndDateAsync(user, null), Times.Once);
        _userManagerMock.Verify(x => x.SetLockoutEnabledAsync(user, false), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_Success()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = User.Create("Nombre", "Apellido", "email@test.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        typeof(User).GetProperty("Id")?.SetValue(user, userId);
        
        _userManagerMock.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync(user);
        
        _userManagerMock.Setup(x => x.DeleteAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _sut.DeleteAsync(userId);

        // Assert
        result.IsError.Should().BeFalse();
        _userManagerMock.Verify(x => x.DeleteAsync(user), Times.Once);
    }

    [Fact]
    public async Task SuspenderAsync_UserNotFound_ReturnsNotFoundError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        
        _userManagerMock.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _sut.SuspenderAsync(userId);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
    }
}