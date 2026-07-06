import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Button, Modal } from '../../../components/ui';
import { ConfirmActionModal } from '../../../components/ConfirmActionModal';
import { useImportantNotification } from '../../../hooks/useImportantNotification';
import { useNotifications } from '../../../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';
import { profesorApi, actividadesApi } from '../../../api';
import { Actividad } from '../../../types';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const formatDateShort = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

const tipoLabel: Record<string, string> = {
  TrenSuperior: 'Tren Superior',
  TrenMedio: 'Tren Medio',
  TrenInferior: 'Tren Inferior',
};

const estadoLabel: Record<string, string> = {
  Propuesta: 'Propuesta',
  Aprobada: 'Aprobada',
  EnCurso: 'En Curso',
  Finalizada: 'Finalizada',
  Cancelada: 'Cancelada',
};

const NULL_GUID = '00000000-0000-0000-0000-000000000000';

const CLASE_DURACION_MS = 60 * 60 * 1000;
const VENTANA_QR_MS = 60 * 60 * 1000;

function qrDisponible(act: Actividad): boolean {
  if (act.estado !== 'Aprobada' && act.estado !== 'EnCurso' && act.estado !== 'Finalizada') return false;
  const inicio = new Date(act.fechaYHora).getTime();
  const ahora = Date.now();
  return ahora >= inicio - VENTANA_QR_MS && ahora <= inicio + CLASE_DURACION_MS + VENTANA_QR_MS;
}

const puedeRemoverProfesor = (act: Actividad): boolean =>
  act.estado !== 'Cancelada' && act.estado !== 'Finalizada' && act.estado !== 'EnCurso';

export function MisClasesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetProfesorId = searchParams.get('profesorId');
  const targetName = searchParams.get('nombre');
  const effectiveProfesorId = targetProfesorId ?? user?.id;
  const [clases, setClases] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [confirmGroupSerieId, setConfirmGroupSerieId] = useState<string | null>(null);
  const importantNotification = useImportantNotification();
  const { showToast } = useNotifications();
  const [qrActividadId, setQrActividadId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!effectiveProfesorId) return;
      setLoading(true);
      try {
        const res = await profesorApi.getMisClases(effectiveProfesorId);
        setClases(res);
      } catch {
        setClases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [effectiveProfesorId]);

  const { grupos, individuales } = useMemo(() => {
    const gruposMap = new Map<string, Actividad[]>();
    const ind: Actividad[] = [];
    for (const act of clases) {
      if (act.serieId && act.serieId.trim() !== '' && act.serieId !== NULL_GUID) {
        if (!gruposMap.has(act.serieId)) {
          gruposMap.set(act.serieId, []);
        }
        gruposMap.get(act.serieId)!.push(act);
      } else {
        ind.push(act);
      }
    }
    return { grupos: Array.from(gruposMap.entries()), individuales: ind };
  }, [clases]);

  const handleRemoverProfesor = async () => {
    if (!selectedActividad || !user) return;
    try {
      await actividadesApi.removerProfesor(selectedActividad.id, user.id);
      setClases(prev => prev.filter(a => a.id !== selectedActividad.id));
      await importantNotification({ type: 'success', message: 'Te has dado de baja exitosamente' });
    } catch (err) {
      const apiError = (err as { response?: { data?: { errorCode?: string; error?: string } } })?.response?.data;
      const msg = apiError?.error || apiError?.errorCode || (err as Error)?.message || 'Error al darse de baja';
      showToast(msg, 'error');
    } finally {
      setShowConfirmModal(false);
      setSelectedActividad(null);
    }
  };

  const handleRemoverGrupo = async (serieId: string) => {
    if (!user) return;
    try {
      const groupActividades = grupos.find(([id]) => id === serieId)?.[1] || [];
      const removibles = groupActividades.filter(puedeRemoverProfesor);
      const noRemovibles = groupActividades.filter(a => !puedeRemoverProfesor(a));

      const resultados = await Promise.allSettled(
        removibles.map((act) => actividadesApi.removerProfesor(act.id, user.id))
      );

      const idsExitosos = new Set<string>();
      let count24h = 0;
      let countOtrosErrores = 0;

      resultados.forEach((res, i) => {
        const act = removibles[i];
        if (res.status === 'fulfilled') {
          idsExitosos.add(act.id);
        } else {
          const reason = res.reason as { response?: { data?: { errorCode?: string; error?: string } } };
          const errorCode = reason?.response?.data?.errorCode;
          if (errorCode === 'Profesor.BajaConMenosDe24Horas') {
            count24h++;
          } else {
            countOtrosErrores++;
          }
        }
      });

      setClases(prev => prev.filter(a => !idsExitosos.has(a.id)));

      const partes: string[] = [];
      if (idsExitosos.size > 0) {
        partes.push(`Te has dado de baja de ${idsExitosos.size} ${idsExitosos.size === 1 ? 'actividad' : 'actividades'} exitosamente.`);
      }
      if (count24h > 0) {
        partes.push(`No se pudo dar de baja en ${count24h} ${count24h === 1 ? 'actividad' : 'actividades'} porque comienza${count24h === 1 ? '' : 'n'} en menos de 24 horas.`);
      }
      if (noRemovibles.length > 0) {
        const estados = noRemovibles.map(a => estadoLabel[a.estado] || a.estado).filter((v, i, a) => a.indexOf(v) === i);
        partes.push(`${noRemovibles.length} ${noRemovibles.length === 1 ? 'actividad está' : 'actividades están'} ${estados.join(' / ')}.`);
      }
      if (countOtrosErrores > 0) {
        partes.push(`Ocurrió un error inesperado en ${countOtrosErrores} ${countOtrosErrores === 1 ? 'actividad' : 'actividades'}.`);
      }

      const msg = partes.join(' ');
      if (idsExitosos.size > 0) {
        await importantNotification({ type: 'success', message: msg });
      } else {
        showToast(msg, 'error');
      }
    } catch {
      showToast('Error al procesar la baja', 'error');
    } finally {
      setConfirmGroupSerieId(null);
    }
  };

  const estadoVariant = (estado: string) => {
    switch (estado) {
      case 'Cancelada': return 'warning' as const;
      case 'EnCurso': return 'info' as const;
      case 'Aprobada': return 'success' as const;
      case 'Propuesta': return 'amber' as const;
      default: return 'default' as const;
    }
  };

  return (
    <MainLayout title={targetName ? `Clases de ${targetName}` : 'Mis Clases'}>
      <div className="space-y-6">
        {loading ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Cargando...</p>
          </Card>
        ) : clases.length === 0 ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tienes clases asignadas</p>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100">Actividad</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100">Frecuencia</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100">Horario</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100">Sala</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100">Cupo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100" style={{ width: 240 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map(([serieId, acts]) => {
                    const sorted = [...acts].sort(
                      (a, b) => new Date(a.fechaYHora).getTime() - new Date(b.fechaYHora).getTime()
                    );
                    const first = sorted[0];
                    const last = sorted[sorted.length - 1];
                    const isExpanded = expandedGroup === serieId;
                    const salaUnica = acts.every(a => a.salaNombre === first.salaNombre);

                    const todasNoRemovibles = acts.every(a => !puedeRemoverProfesor(a));
                    return (
                      <>
                        <tr
                          key={serieId}
                          className="border-b border-border/50 dark:border-gray-700/50 hover:bg-primary/10 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => setExpandedGroup(isExpanded ? null : serieId)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <div className="min-w-0">
                                <span className="text-sm font-medium text-dark dark:text-gray-100 truncate">{first.nombre}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge variant="recurrente" className="text-xs shrink-0">Recurrente</Badge></td>
                          <td className="px-4 py-3 text-sm text-dark dark:text-gray-100 whitespace-nowrap">
                            {formatDateShort(first.fechaYHora)}{first.fechaYHora !== last.fechaYHora ? ` — ${formatDateShort(last.fechaYHora)}` : ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-dark dark:text-gray-100 whitespace-nowrap">
                            {formatTime(first.fechaYHora)}
                          </td>
                          <td className="px-4 py-3 text-sm text-dark dark:text-gray-100">{salaUnica ? (first.salaNombre || 'Sin sala') : 'Varias salas'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="success">{tipoLabel[first.tipo] || first.tipo}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="info">{acts.length} clases</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">—</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="danger"
                              size="sm"
                              className="w-full"
                              disabled={todasNoRemovibles}
                              title={todasNoRemovibles ? 'No hay actividades en las que puedas darte de baja' : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmGroupSerieId(serieId);
                              }}
                            >
                              Darse de baja en todas
                            </Button>
                          </td>
                        </tr>
                        {isExpanded && sorted.map((act) => (
                          <tr key={act.id} className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-border/30 dark:border-gray-700/30 hover:bg-primary/10 dark:hover:bg-gray-800">
                            <td className="px-4 py-2.5 pl-10 text-sm text-dark dark:text-gray-100">{act.nombre}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-400 dark:text-gray-500">—</td>
                            <td className="px-4 py-2.5 text-sm text-dark dark:text-gray-100 whitespace-nowrap">{formatDate(act.fechaYHora)}</td>
                            <td className="px-4 py-2.5 text-sm text-dark dark:text-gray-100 whitespace-nowrap">{formatTime(act.fechaYHora)}</td>
                            <td className="px-4 py-2.5 text-sm text-dark dark:text-gray-100">{act.salaNombre || 'Sin sala'}</td>
                            <td className="px-4 py-2.5">
                              <Badge variant="success" className="text-xs">{tipoLabel[act.tipo] || act.tipo}</Badge>
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant={estadoVariant(act.estado)} className="text-xs">
                                {estadoLabel[act.estado] || act.estado}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant={act.cupoDisponible > 0 ? 'success' : 'warning'} className="text-xs">
                                {act.cupoMaximo - act.cupoDisponible}/{act.cupoMaximo}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex gap-1.5">
                                {qrDisponible(act) && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 min-w-0"
                                    onClick={(e) => { e.stopPropagation(); setQrActividadId(act.id); }}
                                  >
                                    QR
                                  </Button>
                                )}
                                {act.profesorId && act.profesorId !== NULL_GUID ? (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    className="flex-1 min-w-0"
                                    disabled={!puedeRemoverProfesor(act)}
                                    title={!puedeRemoverProfesor(act) ? `No puedes darte de baja de una actividad ${estadoLabel[act.estado]?.toLowerCase() || act.estado.toLowerCase()}` : undefined}
                                    onClick={(e) => { e.stopPropagation(); setSelectedActividad(act); setShowConfirmModal(true); }}
                                  >
                                    Baja
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                  {individuales.map((act) => (
                    <tr key={act.id} className="border-b border-border/50 dark:border-gray-700/50 hover:bg-primary/10 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-dark dark:text-gray-100">{act.nombre}</td>
                      <td className="px-4 py-3"><Badge variant="esporadica" className="text-xs shrink-0">Esporádica</Badge></td>
                      <td className="px-4 py-3 text-sm text-dark dark:text-gray-100 whitespace-nowrap">{formatDate(act.fechaYHora)}</td>
                      <td className="px-4 py-3 text-sm text-dark dark:text-gray-100 whitespace-nowrap">{formatTime(act.fechaYHora)}</td>
                      <td className="px-4 py-3 text-sm text-dark dark:text-gray-100">{act.salaNombre || 'Sin sala'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="success">{tipoLabel[act.tipo] || act.tipo}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={estadoVariant(act.estado)}>
                          {estadoLabel[act.estado] || act.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={act.cupoDisponible > 0 ? 'success' : 'warning'}>
                          {act.cupoMaximo - act.cupoDisponible}/{act.cupoMaximo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {qrDisponible(act) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 min-w-0"
                              onClick={() => setQrActividadId(act.id)}
                            >
                              QR
                            </Button>
                          )}
                          {act.profesorId && act.profesorId !== NULL_GUID ? (
                            <Button
                              variant="danger"
                              size="sm"
                              className="flex-1 min-w-0"
                              disabled={!puedeRemoverProfesor(act)}
                              title={!puedeRemoverProfesor(act) ? `No puedes darte de baja de una actividad ${estadoLabel[act.estado]?.toLowerCase() || act.estado.toLowerCase()}` : undefined}
                              onClick={() => { setSelectedActividad(act); setShowConfirmModal(true); }}
                            >
                              Baja
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <ConfirmActionModal
        isOpen={showConfirmModal}
        title="¿Darse de baja?"
        body={`¿Estás seguro de que querés darte de baja de "${selectedActividad?.nombre}"?`}
        confirmLabel="Darse de baja"
        onConfirm={handleRemoverProfesor}
        onCancel={() => { setShowConfirmModal(false); setSelectedActividad(null); }}
      />

      <ConfirmActionModal
        isOpen={!!confirmGroupSerieId}
        title="¿Darse de baja de todas?"
        body="¿Estás seguro de que querés darte de baja de todas las actividades de esta serie recurrente?"
        confirmLabel="Darse de baja de todas"
        onConfirm={() => confirmGroupSerieId && handleRemoverGrupo(confirmGroupSerieId)}
        onCancel={() => setConfirmGroupSerieId(null)}
      />

      <Modal isOpen={!!qrActividadId} onClose={() => setQrActividadId(null)} title="Código QR">
        <div className="flex flex-col items-center gap-4 py-4">
          {qrActividadId && (
            <img
              src={actividadesApi.getQrUrl(qrActividadId)}
              alt="QR de asistencia"
              className="w-64 h-64 rounded-xl border border-border dark:border-gray-700"
            />
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Escaneá este código para registrar tu asistencia
          </p>
        </div>
      </Modal>

    </MainLayout>
  );
}
