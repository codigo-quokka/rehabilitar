using Application.Auth;
using Application.Auth.DTOs;
using Application.Clientes;
using Application.Common.Interfaces;
using Application.Common.Settings;
using Domain;
using Domain.Clientes;
using ErrorOr;
using Microsoft.AspNetCore.Identity;
using Moq;
using Xunit;
using FluentAssertions;

namespace Application.UnitTests.Auth;

public class AuthServiceTests
{
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<IClienteRepository> _clienteRepoMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IJwtProvider> _jwtMock;
    private readonly FrontendSettings _frontendSettings;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        var userStoreMock = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _clienteRepoMock = new Mock<IClienteRepository>();
        _uowMock = new Mock<IUnitOfWork>();
        _emailServiceMock = new Mock<IEmailService>();
        _jwtMock = new Mock<IJwtProvider>();
        _frontendSettings = new FrontendSettings("http://localhost:5173");

        _uowMock.Setup(x => x.BeginTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _uowMock.Setup(x => x.CommitTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _uowMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _uowMock.Setup(x => x.RollbackTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        _authService = new AuthService(
            _userManagerMock.Object,
            _clienteRepoMock.Object,
            _uowMock.Object,
            _emailServiceMock.Object,
            _jwtMock.Object,
            _frontendSettings
        );
    }

    [Fact]
    public async Task RegisterAsync_CuandoDatosSonValidos_DebeRetornarSuccess()
    {
        // Arrange
        var request = new RegisterRequest("John", "Doe", "Password123!", "john@example.com", "12345678", DateOnly.FromDateTime(DateTime.Now.AddYears(-20)), "1234567890");
        
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        
        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
            
        _userManagerMock.Setup(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<User>()))
            .ReturnsAsync("token");

        _emailServiceMock.Setup(x => x.SendConfirmationEmail(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(Result.Success);

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        result.IsError.Should().BeFalse();
        _clienteRepoMock.Verify(x => x.Add(It.IsAny<Cliente>()), Times.Once);
        _emailServiceMock.Verify(x => x.SendConfirmationEmail(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_CuandoEmailDuplicado_DebeRetornarError()
    {
        // Arrange
        var request = new RegisterRequest("John", "Doe", "Password123!", "john@example.com", "12345678", DateOnly.FromDateTime(DateTime.Now.AddYears(-20)), "1234567890");
        
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "DuplicateEmail", Description = "Email already exists" }));

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Identity.DuplicateEmail");
    }

    [Fact]
    public async Task RegisterAsync_CuandoPasswordDebil_DebeRetornarError()
    {
        // Arrange
        var request = new RegisterRequest("John", "Doe", "123", "john@example.com", "12345678", DateOnly.FromDateTime(DateTime.Now.AddYears(-20)), "1234567890");
        
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "PasswordTooShort", Description = "Password too short" }));

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Identity.PasswordTooShort");
    }

    [Fact]
    public async Task LoginAsync_CuandoCredencialesSonValidas_DebeRetornarAuthResponse()
    {
        // Arrange
        var request = new LoginRequest("john@example.com", "Password123!");
        var user = User.Create("John", "Doe", "john@example.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        user.GetType().GetProperty("EmailConfirmed")?.SetValue(user, true);
        
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);
            
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, request.Password))
            .ReturnsAsync(true);
            
        _userManagerMock.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "Cliente Registrado" });
            
        _jwtMock.Setup(x => x.GenerateJwtToken(user, It.IsAny<IList<string>>()))
            .Returns("token");

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.Token.Should().Be("token");
    }

    [Fact]
    public async Task LoginAsync_CuandoEmailNoVerificado_DebeRetornarError()
    {
        // Arrange
        var request = new LoginRequest("john@example.com", "Password123!");
        var user = User.Create("John", "Doe", "john@example.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);
            
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, request.Password))
            .ReturnsAsync(true);

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Email.NotVerified");
    }

    [Fact]
    public async Task LoginAsync_CuandoCredencialesInvalidas_DebeRetornarError()
    {
        // Arrange
        var request = new LoginRequest("john@example.com", "WrongPassword");
        var user = User.Create("John", "Doe", "john@example.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);
            
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, request.Password))
            .ReturnsAsync(false);

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Auth.InvalidCredentials");
    }

    [Fact]
    public async Task LoginAsync_CuandoCuentaSuspendida_DebeRetornarError()
    {
        // Arrange
        var request = new LoginRequest("john@example.com", "Password123!");
        var user = User.Create("John", "Doe", "john@example.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        user.GetType().GetProperty("EmailConfirmed")?.SetValue(user, true);
        
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);
            
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, request.Password))
            .ReturnsAsync(true);
            
        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(true);

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("User.Suspended");
    }
}
