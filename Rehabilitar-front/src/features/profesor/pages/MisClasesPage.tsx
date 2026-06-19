import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Button } from '../../../components/ui';
import { ConfirmActionModal } from '../../../components/ConfirmActionModal';
import { Notitoast } from '../../../components/Notitoast';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';
import { profesorApi, actividadesApi } from '../../../api';
import { Actividad } from '../../../types';
import { QRModal } from '../../asistencia/components';

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
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [qrActividad, setQrActividad] = useState<{ id: string; nombre: string; fechaYHora: string; sala?: { nombre: string } } | null>(null);
  const { addNotification } = useNotifications();

  const loadData = useCallback(async () => {
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
  }, [effectiveProfesorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      setToastType('success');
      setToastMessage('Te has dado de baja exitosamente');
      setShowToast(true);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err as Error)?.message || 'Error al darse de baja';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setShowConfirmModal(false);
      setSelectedActividad(null);
    }
  };

  const handleRemoverGrupo = async (serieId: string) => {
    if (!user) return;
    try {
      const groupActividades = grupos.find(([id]) => id === serieId)?.[1] || [];
      await Promise.allSettled(
        groupActividades.map((act) => actividadesApi.removerProfesor(act.id, user.id))
      );
      setClases(prev => prev.filter(a => a.serieId !== serieId));
      setToastType('success');
      setToastMessage('Te has dado de baja de todas las actividades exitosamente');
      setShowToast(true);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err as Error)?.message || 'Error al darse de baja';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
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

  const isQRDisponible = (fechaYHora: string): boolean => {
    const now = new Date();
    const start = new Date(fechaYHora);
    const treintaMinAntes = new Date(start.getTime() - 30 * 60 * 1000);
    const sesentaMinDespues = new Date(start.getTime() + 60 * 60 * 1000);
    return now >= treintaMinAntes && now <= sesentaMinDespues;
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark dark:text-gray-100" style={{ width: 170 }}></th>
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
                              <div className="flex items-center gap-1">
                                {isQRDisponible(act.fechaYHora) && (
                                  <button
                                    onClick={() => setQrActividad({ id: act.id, nombre: act.nombre, fechaYHora: act.fechaYHora, sala: act.salaId ? { nombre: act.salaNombre } : null })}
                                    className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400 text-white px-3 py-1 rounded text-sm"
                                  >
                                    QR
                                  </button>
                                )}
                                {act.profesorId && act.profesorId !== NULL_GUID ? (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedActividad(act);
                                      setShowConfirmModal(true);
                                    }}
                                  >
                                    Darse de baja
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
                        <div className="flex items-center gap-1">
                          {isQRDisponible(act.fechaYHora) && (
                            <button
                              onClick={() => setQrActividad({ id: act.id, nombre: act.nombre, fechaYHora: act.fechaYHora, sala: act.salaId ? { nombre: act.salaNombre } : null })}
                              className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400 text-white px-3 py-1 rounded text-sm"
                            >
                              QR
                            </button>
                          )}
                          {act.profesorId && act.profesorId !== NULL_GUID ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => { setSelectedActividad(act); setShowConfirmModal(true); }}
                            >
                              Darse de baja
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

      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      {qrActividad && (
        <QRModal actividad={qrActividad} onClose={() => setQrActividad(null)} />
      )}
    </MainLayout>
  );
}
