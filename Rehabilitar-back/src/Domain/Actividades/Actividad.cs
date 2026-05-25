namespace Domain.Actividades;

using Domain.Clientes;
using Domain.Exceptions;
using Domain.Profesores;
using Domain.Reservas;
using Domain.Salas;
using Domain.Enums;

public class Actividad
{
	public Guid Version { get; private set; } = Guid.NewGuid(); // Para manejar concurrencia optimista, se actualiza cada vez que se modifica la actividad	
	public Guid Id { get; private set; }
	public string Nombre { get; private set; }
	public string Descripcion { get; private set; }

	public TipoEspecialidad Tipo { get; private set; }
	public FrecuenciaActividad Frecuencia { get; private set; } // puede ser un value object
	public EstadoActividad Estado { get; private set; }

	public DateTime FechaYHora { get; private set; }
	public int CupoMaximo { get; private set; }
	public int CupoOcupado { get; private set;}
	public int CupoEsperaOcupado { get; private set; }
	public int CupoDisponible => CupoMaximo - CupoOcupado;
	public bool ProbabilidadListaEspera => 
		CupoMaximo > 0 && (CupoOcupado + Reservas.Count(r => r.EstadoDeReserva == EstadoDeReserva.PendienteDePago)) >= CupoMaximo;
	public decimal Precio { get; private set; }

	public Guid SalaId { get; private set; }
	public Guid? ProfesorId { get; private set; }
	public Guid? SerieId { get; private set; }

	public Sala Sala { get; private set; }
	public Profesor? Profesor { get; private set; }
	private readonly List<Reserva> _reservas = new();
	public ICollection<Reserva> Reservas => _reservas;


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
					 decimal precio,
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
		CupoMaximo = cupoMaximo;
		Precio = precio;
		SalaId = salaId;
		ProfesorId = profesorId;
        SerieId = (frecuencia == FrecuenciaActividad.Recurrente) ? serieId : null; // Para manejar actividades que forman parte de una serie (solo d tipo recurrente)
		CupoOcupado = 0;
		CupoEsperaOcupado = 0;
	}

	public void IniciarClase()
	{
		Estado = EstadoActividad.EnCurso;

		foreach (var reserva in Reservas.Where(r => r.EstadoDeReserva == EstadoDeReserva.PendienteDePago))
		{
			reserva.CancelarReservaPorActividadCancelada();
		}

		foreach (var reserva in Reservas.Where(r => r.EstadoDeReserva == EstadoDeReserva.EnEspera))
		{
			reserva.CancelarReservaPorActividadCancelada();
		}
	}

	public void FinalizarClase(IEnumerable<Cliente> clientes)
	{
		Estado = EstadoActividad.Finalizada;

		foreach (var reserva in Reservas.Where(r => r.EstadoDeReserva == EstadoDeReserva.Activa && r.Asistencia == EstadoAsistencia.Pendiente))
		{
			reserva.MarcarAusente();
			var cliente = clientes.FirstOrDefault(c => c.UserId == reserva.ClienteId);
			if (cliente != null)
			{
				cliente.RegistrarInasistencia();
			}
		}
	}

	public Reserva IniciarReserva(Cliente cliente, TipoCliente tipoCliente)
	{
		Version = Guid.NewGuid();
		Reserva reserva = Reserva.Create(cliente.UserId, this.Id, new DetallePago(this.Precio, 0), EstadoDeReserva.PendienteDePago, tipoCliente);
		return reserva;
	}

	public Reserva ProcesarPagoReserva(Guid reservaId, decimal montoPagado)
	{
		Version = Guid.NewGuid();
		Reserva reserva = Reservas.FirstOrDefault(r => r.Id == reservaId) ?? throw new DomainException("Reserva no encontrada");
		
		var estadoAnterior = reserva.EstadoDeReserva;
		reserva.ActualizarDetallePago(montoPagado);

		// Si la reserva pasó a Activa (o ya lo estaba) y antes no ocupaba cupo, intentamos asignarlo
		if (reserva.EstadoDeReserva == EstadoDeReserva.Activa && estadoAnterior == EstadoDeReserva.PendienteDePago)
		{
			if (HayCupoDisponible())
			{
				CupoOcupado++;
			}
			else
			{
				reserva.Confirmar(EstadoDeReserva.EnEspera);
				CupoEsperaOcupado++;
			}
		}

		return reserva;
	}

	public Reserva CancelarReserva( Guid reservaId)
	{
		Version = Guid.NewGuid();
        var reserva = Reservas.FirstOrDefault(r => r.Id == reservaId) ?? throw new DomainException("Reserva no encontrada");
        
        var horasParaInicio = (FechaYHora - DateTime.UtcNow).TotalHours;

        if (reserva.EstadoDeReserva == EstadoDeReserva.Activa)
		{
			//Reservas.Remove(reserva); lo maneja EFCore (creo)
			CupoOcupado--;	
			if (CupoEsperaOcupado > 0) GestionarListaDeEspera();	
		}
		else if (reserva.EstadoDeReserva == EstadoDeReserva.EnEspera)
		{
			CupoEsperaOcupado--;
		}
		reserva.Cancelar(horasParaInicio);
		return reserva;
	}
	private bool BuscarYPromoverReservaEnEspera(TipoCliente tipoCliente)
	{
		var reservaEnEspera = Reservas
			.Where(r => r.EstadoDeReserva == EstadoDeReserva.EnEspera
				&& r.TipoCliente == tipoCliente)
			.OrderBy(r => r.FechaReserva)
			.FirstOrDefault();
		
		if (reservaEnEspera != null)
		{
			reservaEnEspera.PromoverAActiva(); //primero hacer el chequeo
			CupoEsperaOcupado--;
			CupoOcupado++;
			return true;
		}
		return false;
	}

	private void GestionarListaDeEspera()
	{
		bool lugarOcupado = BuscarYPromoverReservaEnEspera(TipoCliente.Abonado);

		if (!lugarOcupado) BuscarYPromoverReservaEnEspera(TipoCliente.noAbonado);
		
	}

	public void CancelarActividad()
	{
		if (Estado == EstadoActividad.Finalizada)
			throw new InvalidOperationException("No se puede cancelar una actividad que ya está finalizada.");
		Estado = EstadoActividad.Cancelada;

		foreach (var reserva in Reservas.Where(r =>
			r.EstadoDeReserva == EstadoDeReserva.Activa ||
			r.EstadoDeReserva == EstadoDeReserva.EnEspera ))
		{
			reserva.CancelarReservaPorActividadCancelada();
		}
	}

	public void ModificarActividad(Actividad OtraActividad)
	{
		CambiarEstado(OtraActividad.Estado);
		FechaYHora = OtraActividad.FechaYHora;
		CambiarSala(OtraActividad.SalaId);
		EditarDetalles(OtraActividad.Nombre, OtraActividad.Descripcion, OtraActividad.Tipo);
		this.CupoMaximo = OtraActividad.CupoMaximo;
		if (OtraActividad.ProfesorId.HasValue)
			AsignarProfesor(OtraActividad.ProfesorId.Value);
		else
			RemoverProfesor();
		if (OtraActividad.Frecuencia == FrecuenciaActividad.Recurrente)
			HacerRecurrente(OtraActividad.SerieId);
	}
	private void HacerRecurrente(Guid? serieId)
	{
		Frecuencia = FrecuenciaActividad.Recurrente;
		SerieId = serieId;
	}

	public void AsignarProfesor(Guid profesorId)
	{
		ProfesorId = profesorId;
	}

	public void RemoverProfesor()
	{
		ProfesorId = null;
	}

	private void CambiarEstado(EstadoActividad nuevoEstado) // quizas se deba refactorizar para validar transiciones de estado permitidas
	{
		if (Estado == EstadoActividad.Finalizada)
			throw new InvalidOperationException("No se puede cambiar el estado de una actividad que ya está finalizada.");
		Estado = nuevoEstado; 
	}


	private void CambiarSala(Guid nuevaSalaId)
	{
		SalaId = nuevaSalaId;
	}

	private void EditarDetalles(string nuevoNombre, string nuevaDescripcion, TipoEspecialidad nuevoTipo)
	{
		Nombre = nuevoNombre;
		Descripcion = nuevaDescripcion;
		Tipo = nuevoTipo;
	}

	public static Actividad Create(
					 string nombre,
					 string descripcion, 
					 TipoEspecialidad tipo, 
					 FrecuenciaActividad frecuencia, 
					 EstadoActividad estado, 
					 DateTime fechaYHora, 
					 int cupoMaximo, 
					 decimal precio,
					 Guid salaId, 
					 Guid? profesorId,
					 Guid? serieId)
	{
		if (fechaYHora < DateTime.Now)
			throw new ArgumentException("La fecha y hora de la actividad no puede ser en el pasado.");


		return new Actividad(nombre, descripcion, tipo, frecuencia, estado, fechaYHora, cupoMaximo, precio, salaId, profesorId, serieId);
	}


	internal bool HayCupoDisponible() => CupoDisponible > 0;

	public bool EsRecurrente() => Frecuencia == FrecuenciaActividad.Recurrente;

	public bool EsParteDeSerie(Guid serieId) => SerieId.HasValue && SerieId.Value == serieId;
}