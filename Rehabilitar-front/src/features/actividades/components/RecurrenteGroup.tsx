import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Card, Badge, Button, Modal, Input, Select } from "../../../components/ui";
import { Actividad, Role, Sala, User } from "../../../types";
import { actividadesApi, reservasApi } from "../../../api";
import { useAuth } from "../../../hooks/useAuth";
import { ActividadCard } from "./ActividadCard";
import { ConfirmActionModalVerde } from "../../../components/ConfirmActionModalVerde";
import { formatDate, tipoLabel } from "../constants";

interface RecurrenteGroupProps {
  actividades: Actividad[];
  hasRole: (roles: Role[]) => boolean;
  onReservar: (act: Actividad) => void;
  onModificar: (act: Actividad) => void;
  onTomarActividad: (act: Actividad) => void;
  onVerReservas?: (act: Actividad) => void;
  onVerSuscriptores?: (actividadesGrupo: Actividad[]) => void;
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
  onVerSuscriptores,
  salas,
  ...cardProps
}: RecurrenteGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [futureByMonth, setFutureByMonth] = useState<Record<string, Actividad[]>>({});
  const [reservedIds, setReservedIds] = useState<Set<string>>(new Set());
  const [fetchingMonths, setFetchingMonths] = useState(false);
  const { hasRole } = cardProps;
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const [showTomarTodasConfirm, setShowTomarTodasConfirm] = useState(false);

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

  const handleVerSuscriptores = () => {
    onVerSuscriptores?.(actividades);
  }

  const handleAbrirSelectorMeses = async () => {
    setFetchingMonths(true);
    try {
      const userReservas = await reservasApi.getAll({ usuarioId: user!.id });
      const userReservedIds = new Set(userReservas.map(r => r.actividadId));
      setReservedIds(userReservedIds);

      const allFuture = actividades
        .filter(a => new Date(a.fechaYHora) > new Date())
        .sort((a, b) => new Date(a.fechaYHora).getTime() - new Date(b.fechaYHora).getTime());

      if (allFuture.length === 0 || allFuture.every(a => userReservedIds.has(a.id))) {
        onError?.('Ya estás suscripto en esta actividad.');
        return;
      }

      const disponibles = allFuture.filter(a => !userReservedIds.has(a.id));
      if (disponibles.length < 4) {
        onError?.(`Hay ${disponibles.length} clases disponibles. Se necesitan al menos 4 para comprar un paquete. Podés reservarlas individualmente.`);
        return;
      }

      const byMonth: Record<string, Actividad[]> = {};
      for (const act of allFuture) {
        const d = new Date(act.fechaYHora);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = [];
        byMonth[key].push(act);
      }

      setFutureByMonth(byMonth);
      setSelectedMonths(1);
      setShowMonthSelector(true);
    } catch (err) {
      console.error('Error al cargar disponibilidad', err);
      onError?.('Error al cargar la disponibilidad de clases.');
    } finally {
      setFetchingMonths(false);
    }
  };

  const getSelectedFromMonths = useCallback((months: number) => {
    const monthKeys = Object.keys(futureByMonth).sort();
    const selectedMonthKeys = monthKeys.slice(0, months);
    const result: Actividad[] = [];
    for (let i = 0; i < selectedMonthKeys.length; i++) {
      const acts = futureByMonth[selectedMonthKeys[i]];
      if (i < selectedMonthKeys.length - 1) {
        result.push(...acts.slice(0, 4));
      } else {
        result.push(...acts);
      }
    }
    return result.filter(a => !reservedIds.has(a.id));
  }, [futureByMonth, reservedIds]);

  const handleConfirmarCompra = async () => {
    setSubscribeLoading(true);
    try {
      const selectedActs = getSelectedFromMonths(selectedMonths);

      if (selectedActs.length < 1) {
        onError?.('No hay clases disponibles para los meses seleccionados.');
        return;
      }

      if (selectedActs.length < 4) {
        onError?.('Debes seleccionar al menos 4 clases disponibles para comprar el paquete. Seleccioná más meses.');
        return;
      }

      const res = await reservasApi.createRecurrente({
        clienteId: user!.id,
        actividadesIds: selectedActs.map(a => a.id),
      });

      setShowMonthSelector(false);
      navigate(`/reservas/confirmar-paquete/${res.intencionId}`, {
        state: {
          intencionId: res.intencionId,
          actividades: selectedActs,
          montoTotal: selectedActs.reduce((sum, a) => sum + a.precio, 0),
        },
      });
    } catch (err) {
      console.error('Error al comprar paquete', err);
      const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown> }; message?: string };
      const data = axiosErr?.response?.data;
      const msg = typeof data?.error === 'string'
        ? data.error
        : typeof data?.errorCode === 'string'
          ? data.errorCode
          : typeof data?.title === 'string'
            ? data.title
            : typeof data?.message === 'string'
              ? data.message
              : axiosErr?.message ?? 'Error al realizar la compra';
      onError?.(msg);
    } finally {
      setSubscribeLoading(false);
    }
  };

  const monthKeys = useMemo(() => Object.keys(futureByMonth).sort(), [futureByMonth]);
  const totalMonthsDisponibles = monthKeys.length;

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
      const axiosErr = err as { response?: { data?: { error?: string; title?: string ; fieldErrors?: Object} }; message?: string };
      const fieldErrors = axiosErr?.response?.data?.fieldErrors;
      const validationMessage = fieldErrors && Object.keys(fieldErrors).flat()[0];

      const msg = validationMessage || axiosErr?.response?.data?.error || axiosErr?.response?.data?.title || axiosErr?.message || 'Error desconocido';
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
    setShowTomarTodasConfirm(true);
  };

  const handleConfirmarTomarTodas = async () => {
    if (!user) return;
    const unassigned = actividades.filter(
      (act) => (!act.profesorId || act.profesorId === NULL_GUID) && act.tipo === user.especialidad
    );
    setShowTomarTodasConfirm(false);
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
              <Badge variant="recurrente">Recurrente</Badge>
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
            {hasRole(["Administrador"]) && first.estado !== 'Cancelada' && (
              <div className="flex gap-2">
                <Button
                  variant="primary"
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
                    handleVerSuscriptores();
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
                  handleVerSuscriptores();
                }}
              >
                Ver suscriptores
              </Button>
            )}
            {hasRole(["Cliente Registrado"]) && (
              <Button
                variant="primary"
                className="w-full"
                loading={fetchingMonths || subscribeLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAbrirSelectorMeses();
                }}
              >
                Comprar Paquete
              </Button>
            )}
            {hasRole(["Profesor"]) && unassignedCount > 0 && (
              <Button
                variant="primary"
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

      <Modal
        isOpen={showMonthSelector}
        onClose={() => setShowMonthSelector(false)}
        title="Seleccioná los meses de suscripción"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cada mes incluye hasta 4 clases. El último mes se cobran solo las clases disponibles si son menos de 4.
          </p>

          {totalMonthsDisponibles === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hay clases futuras disponibles para esta serie.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.from({ length: totalMonthsDisponibles }, (_, i) => i + 1).map((m) => {
                const selectedMonthKeys = monthKeys.slice(0, m);
                const allActs = selectedMonthKeys.flatMap((key, idx) => {
                  const acts = futureByMonth[key];
                  return idx < selectedMonthKeys.length - 1 ? acts.slice(0, 4) : acts;
                });
                const totalClases = allActs.length;
                const disponibles = allActs.filter(a => !reservedIds.has(a.id)).length;

                const lastMonthKey = selectedMonthKeys[selectedMonthKeys.length - 1];
                const lastActs = futureByMonth[lastMonthKey];
                const lastMonthHasLess = lastActs && lastActs.length < 4;

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonths(m)}
                    className={`w-full p-3 rounded-xl border text-left transition-colors ${
                      selectedMonths === m
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 ring-1 ring-primary'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-dark dark:text-gray-100">
                        {m} {m === 1 ? 'mes' : 'meses'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {totalClases} clases
                        {disponibles < totalClases && (
                          <span className="text-primary font-medium"> ({disponibles} a comprar)</span>
                        )}
                      </span>
                    </div>
                    {lastMonthHasLess && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        * Último mes: {lastActs.length} {lastActs.length === 1 ? 'clase disponible' : 'clases disponibles'}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Clases a comprar</span>
              <span className="font-semibold text-dark dark:text-gray-100">
                {getSelectedFromMonths(selectedMonths).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Meses</span>
              <span className="font-semibold text-dark dark:text-gray-100">
                {selectedMonths} {selectedMonths === 1 ? 'mes' : 'meses'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total estimado</span>
              <span className="font-semibold text-primary">
                ${getSelectedFromMonths(selectedMonths).reduce((s, a) => s + a.precio, 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Fechas seleccionadas</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {(() => {
                const months = Object.keys(futureByMonth).sort().slice(0, selectedMonths);
                const allSelected = months.flatMap((key, idx) => {
                  const acts = futureByMonth[key];
                  return (idx < months.length - 1 ? acts.slice(0, 4) : acts).filter(a => !reservedIds.has(a.id));
                });
                return allSelected.length > 0 ? allSelected.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(a.fechaYHora)} — {new Date(a.fechaYHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500">No hay clases disponibles en los meses seleccionados.</p>
                );
              })()}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              type="button"
              className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setShowMonthSelector(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={subscribeLoading}
              disabled={totalMonthsDisponibles === 0}
              onClick={handleConfirmarCompra}
            >
              Confirmar compra
            </Button>
          </div>
        </div>
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
              <h2 className="text-xl font-bold text-gray-800/90 dark:text-gray-100">
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
                <span className="text-base font-bold text-gray-800/90 dark:text-gray-100 min-w-36 text-center">
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
              <p className="text-sm font-semibold text-gray-200 dark:text-gray-400 mt-4">
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

      <ConfirmActionModalVerde
        isOpen={showTomarTodasConfirm}
        title="Tomar todas las actividades"
        body={`¿Estás seguro de que querés tomar todas las actividades disponibles (${unassignedCount}) de esta serie recurrente?`}
        confirmLabel="Tomar todas"
        onConfirm={handleConfirmarTomarTodas}
        onCancel={() => setShowTomarTodasConfirm(false)}
      />
    </>
  );
}
