namespace Domain.Actividades;

using Domain.Clientes;
using Domain.Profesores;
using Domain.Reservas;
using Domain.Salas;

public class Actividad
{
	public Guid Id { get; private set; }
	public string Nombre { get; private set; }
	public string Descripcion { get; private set; }

	public TipoEspecialidad Tipo { get; private set; }
	public FrecuenciaActividad Frecuencia { get; private set; } // puede ser un value object
	public EstadoActividad Estado { get; private set; }

	public DateTime FechaYHora { get; private set; }
	public int CupoMaximo { get; private set; }
	public int CupoDisponible => CupoMaximo - Reservas.Count(r => r.EstadoDeReserva == EstadoDeReserva.Activa);
	public decimal Precio { get; private set; } = 1000; // Debería venir de una configuración o de la actividad misma, se pone un monto fijo para simplificar

	public Guid SalaId { get; private set; }
	public Guid? ProfesorId { get; private set; }
	public Guid? SerieId { get; private set; }

	public Sala Sala { get; private set; }
	public Profesor? Profesor { get; private set; }
	public ICollection<Reserva> Reservas { get; private set; } = new List<Reserva>();


#nullable disable
	public Actividad() { }
#nullable enable

	private Actividad(string nombre,
					 string descripcion, 
					 TipoEspecialidad tipo, 
					 FrecuenciaActividad frecuencia, 
					 EstadoActividad estado, 
					 DateTime fechaYHora, 
					 int cupoMaximo, 
					 Guid salaId, 
					 Guid? profesorId = null, 
					 Guid? serieId = null)
	{
		Id = Guid.NewGuid();
		Nombre = nombre;
		Descripcion = descripcion;
		Tipo = tipo;
		Frecuencia = frecuencia;
		Estado = estado;
		FechaYHora = fechaYHora;
		CupoMaximo = cupoMaximo; // después debería sacarse del cupo de las salas
		SalaId = salaId;
		ProfesorId = profesorId;
        SerieId = (frecuencia == FrecuenciaActividad.Recurrente) ? serieId : null; // Para manejar actividades que forman parte de una serie (solo d tipo recurrente)
	}

	public void AgregarReserva(Cliente cliente, DetallePago detallePago) // Definir el tipo de cliente, quizás haya que crear una clase Cliente que herede de User para diferenciarlo de otros tipos de usuarios (administradores, profesores, etc.)
	{
		if (CupoDisponible <= 0)
		{
			throw new InvalidOperationException("No hay cupo disponible para esta actividad.");
		}

		var reserva = Reserva.Create(cliente.UserId, this.Id, detallePago); // Crear la reserva con el ID del cliente y de la actividad, el detalle de pago y el estado inicial de activa	
		//cliente.NuevaReserva(reserva); // implementar en cliente para agregar la reserva a su lista de reservas
		Reservas.Add(reserva);
		//ActualizarCupoDisponible(-1);
	}

	public void CancelarReserva( Guid reservaId)
	{
		if (CupoDisponible >= CupoMaximo)
			throw new InvalidOperationException("El cupo disponible ya está al máximo, no se pueden cancelar más reservas.");
		else
		{	
			var reserva = Reservas.FirstOrDefault(r => r.Id == reservaId);
			if (reserva == null)
				throw new KeyNotFoundException("Reserva no encontrada.");
			reserva.CancelarReserva();
			Reservas.Remove(reserva);
		}
	}

	public void ModificarActividad(Actividad OtraActividad)
	{
		CambiarEstado(OtraActividad.Estado);
		CambiarFechaYHora(OtraActividad.FechaYHora);
		CambiarSala(OtraActividad.SalaId);
		EditarDetalles(OtraActividad.Nombre, OtraActividad.Descripcion, OtraActividad.Tipo);
		this.CupoMaximo = OtraActividad.CupoMaximo;
		AsignarProfesor(OtraActividad.ProfesorId ?? Guid.Empty);
		if (OtraActividad.Frecuencia == FrecuenciaActividad.Recurrente)
			HacerRecurrente(OtraActividad.SerieId);
	}
	private void HacerRecurrente(Guid? serieId)
	{
		Frecuencia = FrecuenciaActividad.Recurrente;
		SerieId = serieId;
	}

	private void AsignarProfesor(Guid profesorId)
	{
		ProfesorId = profesorId;
	}

	private void CambiarEstado(EstadoActividad nuevoEstado) // quizas se deba refactorizar para validar transiciones de estado permitidas
	{
		if (Estado == EstadoActividad.Finalizada)
			throw new InvalidOperationException("No se puede cambiar el estado de una actividad que ya está finalizada.");
		Estado = nuevoEstado; 
	}

	private void CambiarFechaYHora(DateTime nuevaFechaYHora)
	{
		FechaYHora =  (nuevaFechaYHora > DateTime.Now) ? 
		nuevaFechaYHora : 
		throw new ArgumentException("La fecha y hora de la actividad no puede ser en el pasado.");
		//verificar que la nueva fecha y hora no entre en conflicto con otras actividades asignadas a la misma sala o profesor
	}

	private void CambiarSala(Guid nuevaSalaId)
	{
		throw new NotImplementedException();
		//verificar disponibilidad de la sala en la fecha y hora antes de asignarla
	}

	private void EditarDetalles(string nuevoNombre, string nuevaDescripcion, TipoEspecialidad nuevoTipo)
	{
		throw new NotImplementedException();
	}

	public static Actividad Create(string nombre,
					 string descripcion, 
					 TipoEspecialidad tipo, 
					 FrecuenciaActividad frecuencia, 
					 EstadoActividad estado, 
					 DateTime fechaYHora, 
					 int cupoMaximo, 
					 Guid salaId, 
					 Guid? profesorId, 
					 Guid? serieId = null)
	{
		if (fechaYHora < DateTime.Now)
			throw new ArgumentException("La fecha y hora de la actividad no puede ser en el pasado.");
		return new Actividad(nombre, descripcion, tipo, frecuencia, estado, fechaYHora, cupoMaximo, salaId, profesorId, serieId);
	}
}