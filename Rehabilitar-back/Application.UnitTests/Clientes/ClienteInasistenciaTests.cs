using Domain.Clientes;
using Domain.Actividades;
using Domain.Reservas;
using Domain.Enums;
using Domain.Users;
using FluentAssertions;
using Xunit;
using System.Collections.Generic;
using System.Linq;
using System;

namespace Domain.UnitTests.Clientes;

public class ClienteInasistenciaTests
{
    [Fact]
    public void RegistrarInasistencia_CuandoEsLlamado_DebeIncrementarContador()
    {
        // Arrange
        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("InasistenciasConsecutivas")?.SetValue(cliente, 0);

        // Act
        cliente.RegistrarInasistencia();

        // Assert
        cliente.InasistenciasConsecutivas.Should().Be(1);
    }

    [Fact]
    public void RegistrarInasistencia_CuandoLlegaATres_DebeSuspenderUsuario()
    {
        // Arrange
        var user = User.Create("Pelo", "Hassan", "pelo@gmail.com", "12345678", DateOnly.FromDateTime(new DateTime(1990, 1, 1)));
        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("User")?.SetValue(cliente, user);
        typeof(Cliente).GetProperty("InasistenciasConsecutivas")?.SetValue(cliente, 2);

        // Act
        cliente.RegistrarInasistencia();

        // Assert
        cliente.InasistenciasConsecutivas.Should().Be(3);
        cliente.User.LockoutEnd.Should().NotBeNull();
        cliente.User.LockoutEnd.Should().Be(DateTimeOffset.MaxValue);
    }

    [Fact]
    public void ResetearInasistencias_CuandoEsLlamado_DebePonerContadorEnCero()
    {
        // Arrange
        var cliente = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("InasistenciasConsecutivas")?.SetValue(cliente, 5);

        // Act
        cliente.ResetearInasistencias();

        // Assert
        cliente.InasistenciasConsecutivas.Should().Be(0);
    }
}

public class ActividadInasistenciaTests
{
    [Fact]
    public void FinalizarClase_CuandoHayReservasPendientes_DebeRegistrarInasistenciaEnClientes()
    {
        // Arrange
        var actividad = (Actividad)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Actividad));
        
        var cliente1Id = Guid.NewGuid();
        var cliente1 = (Cliente)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Cliente));
        typeof(Cliente).GetProperty("UserId")?.SetValue(cliente1, cliente1Id);
        typeof(Cliente).GetProperty("InasistenciasConsecutivas")?.SetValue(cliente1, 0);

        var reserva1 = (Reserva)System.Runtime.Serialization.FormatterServices.GetUninitializedObject(typeof(Reserva));
        typeof(Reserva).GetProperty("ClienteId")?.SetValue(reserva1, cliente1Id);
        typeof(Reserva).GetProperty("EstadoDeReserva")?.SetValue(reserva1, EstadoDeReserva.Activa);
        typeof(Reserva).GetProperty("Asistencia")?.SetValue(reserva1, EstadoAsistencia.Pendiente);

        var reservas = new List<Reserva> { reserva1 };
        typeof(Actividad).GetField("_reservas", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(actividad, reservas);

        var clientes = new List<Cliente> { cliente1 };

        // Act
        actividad.FinalizarClase(clientes);

        // Assert
        reserva1.Asistencia.Should().Be(EstadoAsistencia.Ausente);
        cliente1.InasistenciasConsecutivas.Should().Be(1);
    }
}
