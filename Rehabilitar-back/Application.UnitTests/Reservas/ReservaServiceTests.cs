using Moq;
using FluentAssertions;
using Application.Reservas;
using Application.Reservas.DTOs;
using Application.Actividades;
using Application.Clientes;
using Application.Pagos;
using Application.Pagos.Requests;
using Application.Common.Interfaces;
using Domain.Reservas;
using Domain.Actividades;
using Domain.Clientes;
using Domain.Enums;
using Domain;
using ErrorOr;

namespace Application.UnitTests.Reservas;

public class ReservaServiceTests
{
    private readonly Mock<IReservaRepository> _reservaRepoMock;
    private readonly Mock<IActividadRepository> _actividadRepoMock;
    private readonly Mock<IClienteRepository> _clienteRepoMock;
    private readonly Mock<IIntencionPagoRepository> _intencionPagoRepoMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly ReservaService _sut;

    public ReservaServiceTests()
    {
        _reservaRepoMock = new Mock<IReservaRepository>();
        _actividadRepoMock = new Mock<IActividadRepository>();
        _clienteRepoMock = new Mock<IClienteRepository>();
        _intencionPagoRepoMock = new Mock<IIntencionPagoRepository>();
        _uowMock = new Mock<IUnitOfWork>();

        _sut = new ReservaService(
            _reservaRepoMock.Object,
            _actividadRepoMock.Object,
            _clienteRepoMock.Object,
            _intencionPagoRepoMock.Object,
            _uowMock.Object);
    }

    [Fact]
    public async Task ReservarActividadAsync_CuandoAptoFisicoNoAprobado_DebeRetornarError()
    {
        // Arrange
        var actividadId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();
        var request = new ReservarActividadRequest(actividadId, clienteId, TipoCliente.noAbonado);

        // Mocking Actividad
        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("FechaYHora")?.SetValue(actividad, DateTime.Now.AddDays(1));
        
        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        _reservaRepoMock.Setup(x => x.GetReservasDeActividadPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Reserva>());

        _reservaRepoMock.Setup(x => x.ExisteReservaParaClienteEnHorarioAsync(clienteId, actividad.FechaYHora, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Mocking Cliente
        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        typeof(Cliente).GetProperty("AptoFisicoAprobado")?.SetValue(cliente, false);
        
        _clienteRepoMock.Setup(x => x.GetByIdAsync(clienteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cliente);

        // Act
        var result = await _sut.ReservarActividadAsync(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Reserva.AptoFisicoNoAprobado");
    }

    [Fact]
    public async Task ReservarActividadAsync_CuandoYaTieneOtraReservaEnMismoHorario_DebeRetornarError()
    {
        // Arrange
        var actividadId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();
        var request = new ReservarActividadRequest(actividadId, clienteId, TipoCliente.noAbonado);
        var fechaHora = DateTime.Now.AddDays(1);

        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("FechaYHora")?.SetValue(actividad, fechaHora);
        
        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        _reservaRepoMock.Setup(x => x.ExisteReservaParaClienteEnHorarioAsync(clienteId, fechaHora, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.ReservarActividadAsync(request);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Reserva.HorarioOcupado");
        result.FirstError.Description.Should().Be("Ya tiene otra reserva para este mismo horario");
    }

    // TODO: Fix tests for Checkout Intent
    /*
    [Fact]
    public async Task ReservarActividadAsync_CuandoTodoEsCorrecto_DebeRetornarReserva()
    {
        // Arrange
        var actividadId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();
        var request = new ReservarActividadRequest(actividadId, clienteId, TipoCliente.noAbonado);

        _reservaRepoMock.Setup(x => x.GetReservasDeActividadPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Reserva>());

        // Actividad real para que IniciarReserva funcione
        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("Precio")?.SetValue(actividad, 1000m);
        
        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        typeof(Cliente).GetProperty("AptoFisicoAprobado")?.SetValue(cliente, true);
        
        // Setup User for mapping
        var user = User.Create("Pepe", "López", "pepe@gmail.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        typeof(Cliente).GetProperty("User")?.SetValue(cliente, user);

        _clienteRepoMock.Setup(x => x.GetByIdAsync(clienteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cliente);

        // La reserva que se crea
        _reservaRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken ct) => {
                var r = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
                typeof(Reserva).GetProperty("Id")?.SetValue(r, id);
                typeof(Reserva).GetProperty("ClienteId")?.SetValue(r, clienteId);
                typeof(Reserva).GetProperty("ActividadId")?.SetValue(r, actividadId);
                typeof(Reserva).GetProperty("Cliente")?.SetValue(r, cliente);
                typeof(Reserva).GetProperty("DetallePago")?.SetValue(r, new DetallePago(1000m, 0));
                typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(r, EstadoDeReserva.PendienteDePago);
                return r;
            });

        // Act
        var result = await _sut.ReservarActividadAsync(request);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.ClienteId.Should().Be(clienteId);
        result.Value.NombreCliente.Should().Be("Pepe López");
        result.Value.EstadoDeReserva.Should().Be(EstadoDeReserva.PendienteDePago);
        _reservaRepoMock.Verify(x => x.Add(It.IsAny<Reserva>()), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    */

        [Fact]
        public async Task ConfirmarPagoReservaAsync_CuandoNoHayCupo_DebeQuedarEnEspera()
        {
        // Arrange
        var actividadId = Guid.NewGuid();
        var reservaId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();
        var request = new RegistrarPagoRequest(actividadId, MetodoPago.MercadoPago, 1000m);

        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("CupoMaximo")?.SetValue(actividad, 10);
        typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 10); // Lleno
        typeof(Actividad).GetProperty("CupoEsperaOcupado")?.SetValue(actividad, 0);

        var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
        typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
        typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.PendienteDePago);
        typeof(Reserva).GetProperty("DetallePago")?.SetValue(reserva, new DetallePago(1000m, 0));
        typeof(Reserva).GetProperty("ClienteId")?.SetValue(reserva, clienteId);

        var reservas = new List<Reserva> { reserva };
        typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        _reservaRepoMock.Setup(x => x.GetByIdAsync(reservaId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reserva);

        // Act
        var result = await _sut.ConfirmarPagoReservaAsync(request, reservaId);

        // Assert
        result.IsError.Should().BeFalse();
        reserva.EstadoDeReserva.Should().Be(EstadoDeReserva.EnEspera);
        actividad.CupoEsperaOcupado.Should().Be(1);
        actividad.CupoOcupado.Should().Be(10);
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ConfirmarPagoReservaAsync_CuandoPagoEsMenorAl50PorCiento_DebeSeguirPendienteDePago()
        {
        // Arrange
        var actividadId = Guid.NewGuid();
        var reservaId = Guid.NewGuid();
        var request = new RegistrarPagoRequest(actividadId, MetodoPago.MercadoPago, 400m); // 40% de 1000

        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("CupoMaximo")?.SetValue(actividad, 10);
        typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 0);

        var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
        typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
        typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.PendienteDePago);
        typeof(Reserva).GetProperty("DetallePago")?.SetValue(reserva, new DetallePago(1000m, 0));

        var reservas = new List<Reserva> { reserva };
        typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        _reservaRepoMock.Setup(x => x.GetByIdAsync(reservaId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reserva);

        // Act
        var result = await _sut.ConfirmarPagoReservaAsync(request, reservaId);

        // Assert
        result.IsError.Should().BeFalse();
        reserva.EstadoDeReserva.Should().Be(EstadoDeReserva.PendienteDePago);
        reserva.DetallePago.MontoPagado.Should().Be(400m);
        actividad.CupoOcupado.Should().Be(0);
        }

        [Fact]
        public async Task CancelarReservaAsync_CuandoExiste_DebeCambiarEstadoACancelada()
        {
        // Arrange
        var actividadId = Guid.NewGuid();
        var reservaId = Guid.NewGuid();

        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 1);

        var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
        typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
        typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.Activa);

        var reservas = new List<Reserva> { reserva };
        typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        // Act
        var result = await _sut.CancelarReservaAsync(actividadId, reservaId);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(Result.Deleted);
        reserva.EstadoDeReserva.Should().Be(EstadoDeReserva.Cancelada);
        actividad.CupoOcupado.Should().Be(0);
        _uowMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task CancelarReservaAsync_AbonadoMasDe48hs_DebeOtorgarRehabilicoinYResetearContador()
        {
        // Arrange
        var actividadId = Guid.NewGuid();
        var reservaId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();

        // Actividad en 3 días (> 48hs)
        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("FechaYHora")?.SetValue(actividad, DateTime.UtcNow.AddDays(3));
        typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 1);

        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        typeof(Cliente).GetProperty("RehabiliCoins")?.SetValue(cliente, 0);
        typeof(Cliente).GetProperty("CancelacionesConsecutivas")?.SetValue(cliente, 2);

        var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
        typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
        typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.Activa);
        typeof(Reserva).GetProperty("TipoCliente")?.SetValue(reserva, TipoCliente.Abonado);
        typeof(Reserva).GetProperty("Cliente")?.SetValue(reserva, cliente);

        var reservas = new List<Reserva> { reserva };
        typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        // Act
        await _sut.CancelarReservaAsync(actividadId, reservaId);

        // Assert
        reserva.EstadoDeReserva.Should().Be(EstadoDeReserva.Cancelada);
        cliente.RehabiliCoins.Should().Be(1, "Debe recibir un crédito al cancelar con > 48hs");
        cliente.CancelacionesConsecutivas.Should().Be(0, "Debe resetear el contador de cancelaciones consecutivas");
        }

        [Fact]
        public async Task CancelarReservaAsync_AbonadoMenosDe48hs_DebeIncrementarContadorYNoDarCredito()
        {
        // Arrange
        var actividadId = Guid.NewGuid();
        var reservaId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();

        // Actividad en 1 día (< 48hs)
        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("FechaYHora")?.SetValue(actividad, DateTime.UtcNow.AddDays(1));
        typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 1);

        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        typeof(Cliente).GetProperty("RehabiliCoins")?.SetValue(cliente, 0);
        typeof(Cliente).GetProperty("CancelacionesConsecutivas")?.SetValue(cliente, 0);

        var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
        typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
        typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.Activa);
        typeof(Reserva).GetProperty("TipoCliente")?.SetValue(reserva, TipoCliente.Abonado);
        typeof(Reserva).GetProperty("Cliente")?.SetValue(reserva, cliente);

        var reservas = new List<Reserva> { reserva };
        typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        // Act
        await _sut.CancelarReservaAsync(actividadId, reservaId);

        // Assert
        reserva.EstadoDeReserva.Should().Be(EstadoDeReserva.Cancelada);
        cliente.RehabiliCoins.Should().Be(0, "No debe recibir crédito al cancelar con < 48hs");
        cliente.CancelacionesConsecutivas.Should().Be(1, "Debe incrementar el contador de cancelaciones consecutivas");
        }

        [Fact]
        public async Task CancelarReservaAsync_NoAbonadoMasDe24hs_DebeReembolsarSena()
        {
        // Arrange
        var actividadId = Guid.NewGuid();
        var reservaId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();

        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("FechaYHora")?.SetValue(actividad, DateTime.UtcNow.AddDays(2));
        typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 1);

        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        typeof(Cliente).GetProperty("SaldoAFavor")?.SetValue(cliente, new SaldoAFavor(0m));

        var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
        typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
        typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.Activa);
        typeof(Reserva).GetProperty("TipoCliente")?.SetValue(reserva, TipoCliente.noAbonado);
        typeof(Reserva).GetProperty("DetallePago")?.SetValue(reserva, new DetallePago(1000m, 500m));
        typeof(Reserva).GetProperty("Cliente")?.SetValue(reserva, cliente);

        var reservas = new List<Reserva> { reserva };
        typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        // Act
        await _sut.CancelarReservaAsync(actividadId, reservaId);

        // Assert
        reserva.EstadoDeReserva.Should().Be(EstadoDeReserva.Cancelada);
        cliente.SaldoAFavor.MontoTotal.Should().Be(500m, "Debe reembolsar la seña al cancelar con > 24hs");
        }

        [Fact]
        public async Task CancelarReservaAsync_NoAbonadoMenosDe24hs_NoDebeReembolsarSena()
        {
        // Arrange
        var actividadId = Guid.NewGuid();
        var reservaId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();

        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
        typeof(Actividad).GetProperty("FechaYHora")?.SetValue(actividad, DateTime.UtcNow.AddHours(10));
        typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 1);

        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
        typeof(Cliente).GetProperty("SaldoAFavor")?.SetValue(cliente, new SaldoAFavor(0m));

        var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
        typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
        typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.Activa);
        typeof(Reserva).GetProperty("TipoCliente")?.SetValue(reserva, TipoCliente.noAbonado);
        typeof(Reserva).GetProperty("DetallePago")?.SetValue(reserva, new DetallePago(1000m, 500m));
        typeof(Reserva).GetProperty("Cliente")?.SetValue(reserva, cliente);

        var reservas = new List<Reserva> { reserva };
        typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

        _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(actividad);

        // Act
        await _sut.CancelarReservaAsync(actividadId, reservaId);

        // Assert
        reserva.EstadoDeReserva.Should().Be(EstadoDeReserva.Cancelada);
        cliente.SaldoAFavor.MontoTotal.Should().Be(0m, "No debe reembolsar la seña al cancelar con < 24hs");
        }

        [Fact]
        public async Task CancelarReservaAsync_AbonadoMenosDe48hs_PrimeraVez_DebeDar30PorCientoDescuento()
        {
            // Arrange
            var actividadId = Guid.NewGuid();
            var reservaId = Guid.NewGuid();
            var clienteId = Guid.NewGuid();

            var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
            typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
            typeof(Actividad).GetProperty("FechaYHora")?.SetValue(actividad, DateTime.UtcNow.AddDays(1));
            typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 1);

            var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
            typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
            typeof(Cliente).GetProperty("CancelacionesConsecutivas")?.SetValue(cliente, 0);

            var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
            typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
            typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.Activa);
            typeof(Reserva).GetProperty("TipoCliente")?.SetValue(reserva, TipoCliente.Abonado);
            typeof(Reserva).GetProperty("Cliente")?.SetValue(reserva, cliente);

            var reservas = new List<Reserva> { reserva };
            typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

            _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(actividad);

            // Act
            await _sut.CancelarReservaAsync(actividadId, reservaId);

            // Assert
            cliente.CancelacionesConsecutivas.Should().Be(1);
            cliente.DescuentoProximaReserva.Should().Be(0.30m);
        }

        [Fact]
        public async Task CancelarReservaAsync_AbonadoMenosDe48hs_SegundaVez_DebeDar20PorCientoDescuento()
        {
            // Arrange
            var actividadId = Guid.NewGuid();
            var reservaId = Guid.NewGuid();
            var clienteId = Guid.NewGuid();

            var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
            typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
            typeof(Actividad).GetProperty("FechaYHora")?.SetValue(actividad, DateTime.UtcNow.AddDays(1));
            typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 1);

            var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
            typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
            typeof(Cliente).GetProperty("CancelacionesConsecutivas")?.SetValue(cliente, 1);

            var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
            typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
            typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.Activa);
            typeof(Reserva).GetProperty("TipoCliente")?.SetValue(reserva, TipoCliente.Abonado);
            typeof(Reserva).GetProperty("Cliente")?.SetValue(reserva, cliente);

            var reservas = new List<Reserva> { reserva };
            typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

            _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(actividad);

            // Act
            await _sut.CancelarReservaAsync(actividadId, reservaId);

            // Assert
            cliente.CancelacionesConsecutivas.Should().Be(2);
            cliente.DescuentoProximaReserva.Should().Be(0.20m);
        }

        [Fact]
        public async Task CancelarReservaAsync_AbonadoMenosDe48hs_TerceraVez_NoDebeDarDescuento()
        {
            // Arrange
            var actividadId = Guid.NewGuid();
            var reservaId = Guid.NewGuid();
            var clienteId = Guid.NewGuid();

            var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
            typeof(Actividad).GetProperty("Id")?.SetValue(actividad, actividadId);
            typeof(Actividad).GetProperty("FechaYHora")?.SetValue(actividad, DateTime.UtcNow.AddDays(1));
            typeof(Actividad).GetProperty("CupoOcupado")?.SetValue(actividad, 1);

            var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
            typeof(Cliente).GetProperty("UserId")?.SetValue(cliente, clienteId);
            typeof(Cliente).GetProperty("CancelacionesConsecutivas")?.SetValue(cliente, 2);

            var reserva = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
            typeof(Reserva).GetProperty("Id")?.SetValue(reserva, reservaId);
            typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva, EstadoDeReserva.Activa);
            typeof(Reserva).GetProperty("TipoCliente")?.SetValue(reserva, TipoCliente.Abonado);
            typeof(Reserva).GetProperty("Cliente")?.SetValue(reserva, cliente);

            var reservas = new List<Reserva> { reserva };
            typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

            _actividadRepoMock.Setup(x => x.ObtenerPorIdAsync(actividadId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(actividad);

            // Act
            await _sut.CancelarReservaAsync(actividadId, reservaId);

            // Assert
            cliente.CancelacionesConsecutivas.Should().Be(3);
            cliente.DescuentoProximaReserva.Should().Be(0m);
        }
    }

