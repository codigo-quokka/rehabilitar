import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Card, Badge, Button, Modal, Input, Select } from "../../../components/ui";
import { Actividad, Role, Sala, User } from "../../../types";
import { actividadesApi } from "../../../api";
import { useAuth } from "../../../hooks/useAuth";
import { ActividadCard } from "./ActividadCard";
import { formatDate, tipoLabel } from "../constants";

interface RecurrenteGroupProps {
  actividades: Actividad[];
  hasRole: (roles: Role[]) => boolean;
  onReservar: (act: Actividad) => void;
  onModificar: (act: Actividad) => void;
  onTomarActividad: (act: Actividad) => void;
  onVerReservas?: (act: Actividad) => void;
  onUpdate: () => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  salas: Sala[];
  profesores: User[];
}

export function RecurrenteGroup({
  actividades,
  onUpdate,
  onError,
  onSuccess,
  onVerReservas,
  salas,
  ...cardProps
}: RecurrenteGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const { hasRole } = cardProps;
  const { user } = useAuth();
  const first = actividades[0];
  const count = actividades.length;

  const NULL_GUID = '00000000-0000-0000-0000-000000000000';
  const unassignedCount = actividades.filter(
    (act) => (!act.profesorId || act.profesorId === NULL_GUID) && (!user || act.tipo === user.especialidad)
  ).length;

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const sorted = [...actividades].sort(
    (a, b) => new Date(a.fechaYHora).getTime() - new Date(b.fechaYHora).getTime()
  );
  const primerFecha = sorted[0].fechaYHora;
  const ultimaFecha = sorted[count - 1].fechaYHora;

  const [verMonth, setVerMonth] = useState(() => {
    const d = new Date(sorted[0].fechaYHora);
    return new Date(d.getFullYear(), d.getMonth());
  });

  const [editForm, setEditForm] = useState({
    nombre: first.nombre,
    descripcion: first.descripcion,
    tipo: first.tipo,
    salaId: first.salaId,
    estado: first.estado,
  });

  const availableMonthKeys = useMemo(() => {
    const months = new Set<string>();
    for (const act of actividades) {
      const d = new Date(act.fechaYHora);
      months.add(`${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`);
    }
    return Array.from(months).sort();
  }, [actividades]);

  const currentKey = `${verMonth.getFullYear()}-${String(verMonth.getMonth()).padStart(2, '0')}`;
  const currentIdx = availableMonthKeys.indexOf(currentKey);

  const goPrevMonth = () => {
    if (currentIdx > 0) {
      const [y, m] = availableMonthKeys[currentIdx - 1].split('-');
      setVerMonth(new Date(parseInt(y), parseInt(m)));
    }
  };

  const goNextMonth = () => {
    if (currentIdx < availableMonthKeys.length - 1) {
      const [y, m] = availableMonthKeys[currentIdx + 1].split('-');
      setVerMonth(new Date(parseInt(y), parseInt(m)));
    }
  };

  const canGoPrev = currentIdx > 0;
  const canGoNext = currentIdx < availableMonthKeys.length - 1;

  const filteredByMonth = useMemo(() => {
    const filtered = actividades.filter((act) => {
      const d = new Date(act.fechaYHora);
      return d.getFullYear() === verMonth.getFullYear() && d.getMonth() === verMonth.getMonth();
    });
    return filtered.sort(
      (a, b) => new Date(a.fechaYHora).getTime() - new Date(b.fechaYHora).getTime()
    );
  }, [actividades, verMonth]);

  useEffect(() => {
    if (!expanded) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handler);
    };
  }, [expanded]);

  const handleOpenEditGroup = () => {
    setEditForm({
      nombre: first.nombre,
      descripcion: first.descripcion,
      tipo: first.tipo,
      salaId: first.salaId,
      estado: first.estado,
    });
    setShowEditGroup(true);
  };

  const handleSubscribe = () => {
      onError?.('Falta implementar suscripcion');
      return;
    }

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const serieId = actividades[0]?.serieId;
      if (!serieId || serieId === NULL_GUID) {
        onError?.('No se pudo identificar la serie recurrente');
        return;
      }
      const firstAct = actividades[0];
      const actividadBase = {
        nombre: editForm.nombre,
        descripcion: editForm.descripcion,
        tipo: editForm.tipo as string,
        salaId: editForm.salaId,
        estado: editForm.estado as string,
        frecuencia: firstAct.frecuencia,
        fechaYHora: firstAct.fechaYHora,
        cupoMaximo: firstAct.cupoMaximo,
        profesorId: firstAct.profesorId && firstAct.profesorId !== NULL_GUID ? firstAct.profesorId : null,
        serieId: serieId,
      };
      await actividadesApi.updateSerie(serieId, {
        actividadBase,
        serieId,
      });
      setShowEditGroup(false);
      onUpdate();
    } catch (err) {
      console.error('Error al modificar grupo', err);
      const axiosErr = err as { response?: { data?: { error?: string; title?: string } }; message?: string };
      const msg = axiosErr?.response?.data?.error || axiosErr?.response?.data?.title || axiosErr?.message || 'Error desconocido';
      onError?.(`Error al modificar la serie: ${msg}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleTomarTodas = async () => {
    if (!user) {
      onError?.('Debe iniciar sesión para tomar actividades');
      return;
    }
    const unassigned = actividades.filter(
      (act) => (!act.profesorId || act.profesorId === NULL_GUID) && act.tipo === user.especialidad
    );
    if (unassigned.length === 0) return;
    const results = await Promise.allSettled(unassigned.map((act) => actividadesApi.asignarProfesor(act.id, user.id)));
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      const reasons = failed.map(r => {
        const err = (r as PromiseRejectedResult).reason;
        return err?.response?.data?.error || err?.message || 'Error desconocido';
      });
      onError?.(`${failed.length} actividad(es) no pudieron asignarse: ${reasons[0]}`);
    }
    const succeeded = results.filter(r => r.status === 'fulfilled');
    if (succeeded.length > 0 && failed.length === 0) {
      onSuccess?.(`Te has asignado a ${succeeded.length} actividad(es) exitosamente`);
    } else if (succeeded.length > 0 && failed.length > 0) {
      onSuccess?.(`Te has asignado a ${succeeded.length} actividad(es), pero ${failed.length} no pudieron asignarse`);
    }
    onUpdate();
  };

  const stripe =
    "h-2.5 border-x border-b border-border dark:border-gray-700 rounded-b-2xl pointer-events-none";

  return (
    <>
      <div
        onClick={() => setExpanded(true)}
        role="button"
        tabIndex={0}
        aria-label={`Grupo de ${count} actividades recurrentes`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded(true);
        }}
        className="cursor-pointer flex flex-col h-full"
      >
      <div className="flex flex-col flex-1">
        <Card className="flex flex-col flex-1 transition-shadow hover:shadow-dark-green hover:bg-green-50 dark:hover:bg-gray-900 dark:hover:shadow-gray-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-2">
              <Badge variant="success">{tipoLabel[first.tipo] || first.tipo}</Badge>
              <Badge className="bg-purple-200 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300">Recurrente</Badge>
            </div>
            <Badge variant="info">
              {count} actividades
            </Badge>
          </div>

          <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-2">
            {first.nombre}
          </h3>

          <p className="text-dark dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {first.descripcion}
          </p>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(primerFecha)}{primerFecha !== ultimaFecha ? ` — ${formatDate(ultimaFecha)}` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {first.salaNombre}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {first.profesorNombre || "Sin profesor asignado"}
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex flex-col gap-2">
            {hasRole(["Administrador"]) && (
              <div className="flex gap-2">
                <Button
                  variant="verde"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditGroup();
                  }}
                >
                  Modificar todas
                </Button>
                <Button
                  variant="violeta"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe();
                  }}
                >
                  Ver suscriptores
                </Button>
              </div>
            )}
            {hasRole(["Recepción"]) && onVerReservas && (
              <Button
                variant="violeta"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubscribe();
                }}
              >
                Ver suscriptores
              </Button>
            )}
            {hasRole(["Cliente Registrado"]) && (
              <Button
                variant="verde"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubscribe();
                }}
              >
                Suscribirse
              </Button>
            )}
            {hasRole(["Profesor"]) && unassignedCount > 0 && (
              <Button
                variant="verde"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTomarTodas();
                }}
              >
                Tomar todas ({unassignedCount} disponibles)
              </Button>
            )}
          </div>
        </Card>
        <div className={`${stripe} -mt5 bg-dark/5 w-[92%] mx-auto`} />
        <div className={`${stripe} shadow-xl -mt5 bg-dark/20 w-[84%] mx-auto`} />
        <div className={`${stripe} shadow-xl -mt5 bg-dark/40 w-[76%] mx-auto`} />
        <div className={`${stripe} shadow-xl -mt5 bg-dark/50 w-[68%] mx-auto`} />
      </div>
      </div>

      <Modal
        isOpen={showEditGroup}
        onClose={() => setShowEditGroup(false)}
        title="Modificar todas las actividades"
        size="lg"
      >
        
        <form onSubmit={handleEditGroup} className="space-y-4">
          <Input
            label="Nombre"
            value={editForm.nombre}
            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-dark dark:text-gray-100 mb-1.5">
              Descripción
            </label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-dark dark:text-gray-100"
              rows={3}
              value={editForm.descripcion}
              onChange={(e) =>
                setEditForm({ ...editForm, descripcion: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={editForm.tipo}
              onChange={(e) =>
                setEditForm({ ...editForm, tipo: e.target.value })
              }
              options={[
                { value: "TrenSuperior", label: "Tren Superior" },
                { value: "TrenMedio", label: "Tren Medio" },
                { value: "TrenInferior", label: "Tren Inferior" },
              ]}
            />
            <Select
              label="Sala"
              value={editForm.salaId}
              onChange={(e) =>
                setEditForm({ ...editForm, salaId: e.target.value })
              }
              options={[
                { value: "", label: "Seleccione una sala..." },
                ...salas.filter((s) => s.activo).map((s) => ({ value: s.id, label: s.nombre })),
              ]}
              required
            />
          </div>
          <Select
            label="Estado"
            value={editForm.estado}
            onChange={(e) =>
              setEditForm({ ...editForm, estado: e.target.value })
            }
            options={[
              { value: "Propuesta", label: "Propuesta" },
              { value: "Aprobada", label: "Aprobada" },
              { value: "Cancelada", label: "Cancelada" },
            ]}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              type="button"
              className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setShowEditGroup(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={editLoading}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>

      {expanded && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30"
            onClick={() => setExpanded(false)}
          />
          <div
            className="relative w-full max-h-[85vh] overflow-y-auto overscroll-contain p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-6 relative">
              <button
                onClick={() => setExpanded(false)}
                className="absolute -top-4 -right-4 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-dark dark:text-gray-100">
                {first.nombre}
              </h2>
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); goPrevMonth(); }}
                  disabled={!canGoPrev}
                  className={`p-1.5 rounded-lg transition-colors ${
                    canGoPrev
                      ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-dark dark:text-gray-100'
                      : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  aria-label="Mes anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-base font-semibold text-dark dark:text-gray-100 min-w-36 text-center">
                  {monthNames[verMonth.getMonth()]} {verMonth.getFullYear()}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); goNextMonth(); }}
                  disabled={!canGoNext}
                  className={`p-1.5 rounded-lg transition-colors ${
                    canGoNext
                      ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-dark dark:text-gray-100'
                      : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  aria-label="Mes siguiente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-200 dark:text-gray-400 mt-4">
                {filteredByMonth.length} {filteredByMonth.length === 1 ? 'actividad' : 'actividades'} en {monthNames[verMonth.getMonth()]}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredByMonth.length > 0 ? (
                filteredByMonth.map((act) => (
                  <ActividadCard
                    key={act.id}
                    actividad={act}
                    {...cardProps}
                    onVerReservas={onVerReservas}
                    onModificar={(a) => {
                      setExpanded(false);
                      cardProps.onModificar(a);
                    }}
                    onTomarActividad={async (a) => {
                      setExpanded(false);
                      await cardProps.onTomarActividad(a);
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                  No hay actividades en {monthNames[verMonth.getMonth()]}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
