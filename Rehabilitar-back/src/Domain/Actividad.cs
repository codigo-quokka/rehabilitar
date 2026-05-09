namespace Domain;

using Domain.Enums;

public class Actividad
{
	public Guid Id { get; private set; }
	public string Nombre { get; private set; }
	public string Descripcion { get; private set; }

	public TipoActividad Tipo { get; private set; }
	public FrecuenciaActividad Frecuencia { get; private set; }
	public EstadoActividad Estado { get; private set; }

	public DateTime FechaYHora { get; private set; }
	public int CupoMaximo { get; private set; }
	public int CupoDisponible { get; private set; }

	public Guid SalaId { get; private set; }
	public Guid? ProfesorId { get; private set; }
	public Guid? SerieId { get; private set; }

	public Sala Sala { get; private set; }
	public User Profesor { get; private set; }
	public ICollection<Reserva> Reservas { get; private set; } = new List<Reserva>();


#nullable disable
	public Actividad() { }
#nullable enable

	public Actividad(string nombre, string descripcion, TipoActividad tipo, FrecuenciaActividad frecuencia, EstadoActividad estado, DateTime fechaYHora, int cupoMaximo, Sala sala, User profesor, Guid? profesorId = null, Guid? serieId = null)
	{
		Id = Guid.NewGuid();
		Nombre = nombre;
		Descripcion = descripcion;
		Tipo = tipo;
		Frecuencia = frecuencia;
		Estado = estado;

		if (fechaYHora < DateTime.Now)
			throw new ArgumentException("La fecha y hora de la actividad no puede ser en el pasado.");
		else
			FechaYHora = fechaYHora;
		
		CupoMaximo = cupoMaximo; // después debería sacarse del cupo de las salas
		CupoDisponible = cupoMaximo;
		Sala = sala;
		SalaId = Sala.Id;
		Profesor = profesor;
		ProfesorId = profesor.Id;
        SerieId = (frecuencia == FrecuenciaActividad.Recurrente) ? serieId : null; // Para manejar actividades que forman parte de una serie (solo d tipo recurrente)
		Reservas.Clear();
	}

	public void AgregarReserva(User cliente) // Definir el tipo de cliente, quizás haya que crear una clase Cliente que herede de User para diferenciarlo de otros tipos de usuarios (administradores, profesores, etc.)
	{
		if (CupoDisponible <= 0)
		{
			throw new InvalidOperationException("No hay cupo disponible para esta actividad.");
		}

		var reserva = new Reserva(cliente, this);
		//cliente.NuevaReserva(reserva); // implementar en cliente para agregar la reserva a su lista de reservas
		Reservas.Add(reserva);
		ActualizarCupoDisponible(-1);
	}

	public void CancelarReserva()
	{
		if (CupoDisponible >= CupoMaximo)
			throw new InvalidOperationException("El cupo disponible ya está al máximo, no se pueden cancelar más reservas.");		
		else
			ActualizarCupoDisponible(1);
			throw new NotImplementedException("Lógica para cancelar una reserva específica no implementada."); // implementar lógica para cancelar una reserva específica, quizás recibiendo el id de la reserva a cancelar o el cliente que la hizo para identificarla
	}

	private void ActualizarCupoDisponible(int cantidad)
	{
		if (cantidad < 0 && CupoDisponible - Math.Abs(cantidad) < 0)
			throw new InvalidOperationException("No se puede reducir el cupo disponible por debajo de cero.");
		if (cantidad > 0 && CupoDisponible + cantidad > CupoMaximo)
			throw new InvalidOperationException("No se puede aumentar el cupo disponible por encima del cupo máximo.");

		CupoDisponible += cantidad;
	}

	public void AsignarProfesor(Guid profesorId)
	{
		ProfesorId = profesorId;
	}

	public void CambiarEstado(EstadoActividad nuevoEstado) // quizas se deba refactorizar para validar transiciones de estado permitidas
	{
		if (Estado == EstadoActividad.Finalizada)
			throw new InvalidOperationException("No se puede cambiar el estado de una actividad que ya está finalizada.");
		Estado = nuevoEstado; 
	}

	public void CambiarFechaYHora(DateTime nuevaFechaYHora)
	{
		FechaYHora =  (nuevaFechaYHora > DateTime.Now) ? 
		nuevaFechaYHora : 
		throw new ArgumentException("La fecha y hora de la actividad no puede ser en el pasado.");
		//verificar que la nueva fecha y hora no entre en conflicto con otras actividades asignadas a la misma sala o profesor
	}

	public void CambiarSala(Guid nuevaSalaId)
	{
		throw new NotImplementedException();
		//verificar disponibilidad de la sala en la fecha y hora antes de asignarla
	}

	public void EditarDetalles(string nuevoNombre, string nuevaDescripcion, TipoActividad nuevoTipo)
	{
		throw new NotImplementedException();
	}
}