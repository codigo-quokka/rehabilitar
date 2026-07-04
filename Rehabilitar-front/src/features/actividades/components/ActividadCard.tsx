import { Card, Badge, Button } from "../../../components/ui";
import { Actividad, Role } from "../../../types";
import { formatDate, formatTime, tipoLabel, frecuenciaLabel, estadoLabel } from "../constants";
import { useAuth } from "../../../hooks/useAuth";

interface ActividadCardProps {
  actividad: Actividad;
  hasRole: (roles: Role[]) => boolean;
  onReservar: (act: Actividad) => void;
  onModificar: (act: Actividad) => void;
  onTomarActividad: (act: Actividad) => void;
  onVerReservas?: (act: Actividad) => void;
  onAprobar?: (act: Actividad) => void;
  onEliminarPropuesta?: (act: Actividad) => void;
}

export function ActividadCard({
  actividad: act,
  hasRole,
  onReservar,
  onModificar,
  onTomarActividad,
  onVerReservas,
  onAprobar,
  onEliminarPropuesta,
}: ActividadCardProps) {
  const { user } = useAuth();
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2">
          <Badge variant="success">{tipoLabel[act.tipo] || act.tipo}</Badge>
          <Badge variant={act.frecuencia === 'Recurrente' ? 'recurrente' : 'esporadica'}>{frecuenciaLabel[act.frecuencia] || act.frecuencia}</Badge>
          {hasRole(["Administrador", "Profesor", "Recepción"]) && (
            <Badge variant={
              act.estado === 'Cancelada' ? 'warning' :
              act.estado === 'EnCurso' ? 'info' :
              act.estado === 'Aprobada' ? 'success' :
              act.estado === 'Propuesta' ? 'amber' : 'default'
             }>
              {estadoLabel[act.estado] || act.estado}
            </Badge>
          )}
        </div>
        <Badge
          variant={
            act.cupoDisponible <= 0
              ? "warning"
              : "success"
          }
        >
          {act.cupoMaximo - act.cupoDisponible}/{act.cupoMaximo}
        </Badge>
      </div>

      <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-2">
        {act.nombre}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
        {act.descripcion}
      </p>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(act.fechaYHora)}
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatTime(act.fechaYHora)}
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {act.salaNombre}
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {act.profesorNombre || "Sin profesor asignado"}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-2">
        {hasRole(["Cliente Registrado"]) && (
          <Button
            variant={act.cupoDisponible <= 0 ? "danger" : "primary"}
            className="w-full"
            disabled={act.cupoDisponible <= 0}
            onClick={() => onReservar(act)}
          >
            {act.cupoDisponible <= 0 ? "Completo" : "Reservar"}
          </Button>
        )}
        {hasRole(["Administrador"]) && onVerReservas && (
          <div className="flex gap-2">
            {act.estado !== 'Cancelada' && (
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => onModificar(act)}
              >
                Modificar
              </Button>
            )}
            {act.estado !== 'Propuesta' && (
              <Button
                variant="violeta"
                className="flex-1"
                onClick={() => onVerReservas(act)}
              >
                Ver reservas
              </Button>
            )}
          </div>
        )}
        {hasRole(["Administrador"]) && !onVerReservas && act.estado !== 'Cancelada' && (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => onModificar(act)}
          >
            Modificar
          </Button>
        )}
        {hasRole(["Administrador"]) && act.estado === 'Propuesta' && (
          <div className="flex gap-2">
            {onAprobar && (
              <button
                type="button"
                onClick={() => onAprobar(act)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 bg-primary/20 text-dark-green hover:bg-primary/40 dark:bg-dark-green/30 dark:text-green-300 dark:hover:bg-dark-green/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary cursor-pointer"
                aria-label="Aprobar actividad"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Aprobar
              </button>
            )}
            {onEliminarPropuesta && (
              <button
                type="button"
                onClick={() => onEliminarPropuesta(act)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 bg-red-300 text-red-800 hover:bg-red-400 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 cursor-pointer"
                aria-label="Eliminar actividad"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
            )}
          </div>
        )}
        {hasRole(["Recepción"]) && onVerReservas && act.estado !== 'Propuesta' && (
          <Button
            variant="violeta"
            className="w-full"
            onClick={() => onVerReservas(act)}
          >
            Ver reservas
          </Button>
        )}
        {hasRole(["Profesor"]) && (!act.profesorId || act.profesorId === '00000000-0000-0000-0000-000000000000') && user?.especialidad === act.tipo && (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => onTomarActividad(act)}
          >
            Tomar actividad
          </Button>
        )}
      </div>
    </Card>
  );
}
