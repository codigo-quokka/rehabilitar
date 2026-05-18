import { Card, Badge, Button } from "../../../components/ui";
import { Actividad, Role } from "../../../types";
import { formatDate, formatTime, tipoLabel, frecuenciaLabel, estadoLabel } from "../constants";

interface ActividadCardProps {
  actividad: Actividad;
  hasRole: (roles: Role[]) => boolean;
  onReservar: (act: Actividad) => void;
  onModificar: (act: Actividad) => void;
  onTomarActividad: (act: Actividad) => void;
}

export function ActividadCard({
  actividad: act,
  hasRole,
  onReservar,
  onModificar,
  onTomarActividad,
}: ActividadCardProps) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2">
          <Badge variant="success">{tipoLabel[act.tipo] || act.tipo}</Badge>
          <Badge className="bg-secondary/20 text-secondary">{frecuenciaLabel[act.frecuencia] || act.frecuencia}</Badge>
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
            variant={act.cupoDisponible <= 0 ? "outline" : "primary"}
            className="w-full"
            disabled={act.cupoDisponible <= 0}
            onClick={() => onReservar(act)}
          >
            {act.cupoDisponible <= 0 ? "Completo" : "Reservar"}
          </Button>
        )}
        {hasRole(["Administrador"]) && (
          <Button
            variant="verde"
            className="w-full"
            onClick={() => onModificar(act)}
          >
            Modificar
          </Button>
        )}
        {hasRole(["Profesor"]) && (!act.profesorId || act.profesorId === '00000000-0000-0000-0000-000000000000') && (
          <Button
            variant="verde"
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
