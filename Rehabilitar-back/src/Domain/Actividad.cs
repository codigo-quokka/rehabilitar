namespace Domain;
using Domain.Enums;

public class Actividad
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; }
    public string Descripcion { get; private set; }

    public TipoActividad Tipo { get; private set;}
    public FrecuenciaActividad Frecuencia { get; private set;}
    public EstadoActividad Estado { get; private set; }

    public DateTime FechayHora { get; private set; }
    public int CupoMaximo { get; private set; }
    public int CupoDisponible { get; private set; }
    
    public Guid SalaId { get; private set; }
    public Guid? ProfesorId { get; private set; }
    public Guid? SerieId { get; private set; }

    
    #nullable disable
    public Actividad() { }
    #nullable enable

	public Actividad(string nombre, string descripcion, TipoActividad tipo, FrecuenciaActividad frecuencia, EstadoActividad estado, DateTime fechayHora, int cupoMaximo, Guid salaId, Guid? profesorId = null, Guid? serieId = null)
    {
	   Id = Guid.NewGuid();
	   Nombre = nombre;
	   Descripcion = descripcion;
	   Tipo = tipo;
	   Frecuencia = frecuencia;
	   Estado = estado;
	   FechayHora = fechayHora;
	   CupoMaximo = cupoMaximo; // después debería sacarse del cupo de las salas
	   CupoDisponible = cupoMaximo;
	   SalaId = salaId;
	   ProfesorId = profesorId;
	   SerieId = serieId; // Para manejar actividades que forman parte de una serie (solo d tipo recurrentes)
    }

    public void ReservarLugar()
	{
		if (CupoDisponible <= 0)
		{
			ActualizarCupoDisponible(-1);
		}
			throw new InvalidOperationException("No hay cupo disponible para esta actividad.");
	}

	public void CancelarReserva()
	{
		if (CupoDisponible < CupoMaximo)
		{
			ActualizarCupoDisponible(1);
		}
			throw new InvalidOperationException("No se puede cancelar la reserva porque el cupo disponible ya está al máximo.");
	}

	public void ActualizarCupoDisponible(int cantidad)
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

    public void CambiarEstado(EstadoActividad nuevoEstado)
    {
	   Estado = nuevoEstado; // quizas se deba refactorizar para validar transiciones de estado permitidas
    }

    public void CambiarFechaYHora(DateTime nuevaFechaYHora)
	{
		throw new NotImplementedException();
	}

	public void CambiarSala(Guid nuevaSalaId)
	{
		throw new NotImplementedException();
	}





}