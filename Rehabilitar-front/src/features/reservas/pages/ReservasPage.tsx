import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Button } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { reservasApi, actividadesApi } from '../../../api';
import { Reserva, Actividad } from '../../../types';
import { Notitoast } from '../../../components/Notitoast';
import { ConfirmActionModal } from '../../../components/ConfirmActionModal';

const estadoLabel: Record<string, string> = {
  PendienteDePago: 'Pendiente de pago',
  Activa: 'Activa',
  EnEspera: 'En espera',
  Cancelada: 'Cancelada',
};

const estadoVariant: Record<string, 'warning' | 'success' | 'info' | 'danger'> = {
  PendienteDePago: 'warning',
  Activa: 'success',
  EnEspera: 'info',
  Cancelada: 'danger',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

export function ReservasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [actividades, setActividades] = useState<Record<string, Actividad>>({});
  const [loading, setLoading] = useState(true);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const fetchReservas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [res, acts] = await Promise.all([
        reservasApi.getAll({ usuarioId: user.id }),
        actividadesApi.getAll(),
      ]);
      setReservas(res);
      const actsMap: Record<string, Actividad> = {};
      acts.forEach((a) => { actsMap[a.id] = a; });
      setActividades(actsMap);
    } catch (err) {
      const apiError = (err as { response?: { data?: { errorCode?: string; error?: string } } })?.response?.data;
      const msg = apiError?.errorCode ?? apiError?.error ?? 'Error al cargar las reservas';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas, location.state?._refresh]);

  const handlePagar = (reserva: Reserva) => {
    const montoPagado = reserva.montoTotal - reserva.montoPendiente;
    navigate(`/reservas/confirmar/${reserva.id}`, {
      state: {
        reservaId: reserva.id,
        actividadId: reserva.actividadId,
        montoTotal: reserva.montoTotal,
        montoPagado,
        montoPendiente: reserva.montoPendiente,
      },
    });
  };

  const handleCancelClick = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setShowConfirmCancel(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReserva) return;
    setCancelandoId(selectedReserva.id);
    setShowConfirmCancel(false);
    try {
      await reservasApi.cancelar(selectedReserva.id, selectedReserva.actividadId);
      setReservas((prev) => prev.filter((r) => r.id !== selectedReserva.id));
      setToastType('success');
      setToastMessage('Reserva cancelada correctamente');
      setShowToast(true);
    } catch (err) {
      const apiError = (err as { response?: { data?: { errorCode?: string; error?: string } } })?.response?.data;
      const msg = apiError?.errorCode ?? apiError?.error ?? 'Error al cancelar la reserva';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setCancelandoId(null);
      setSelectedReserva(null);
    }
  };

  const montoPagado = (r: Reserva) => r.montoTotal - r.montoPendiente;
  const estaCompletado = (r: Reserva) => r.montoPendiente === 0;

  return (
    <MainLayout title="Mis reservas">
      <div className="space-y-6">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : reservas.length === 0 ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tienes reservas</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservas.map((reserva) => {
              const act = actividades[reserva.actividadId];
              const pagado = montoPagado(reserva);
              const completado = estaCompletado(reserva);

              return (
                <Card key={reserva.id} className="flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={estadoVariant[reserva.estadoDeReserva] || 'default'}>
                      {estadoLabel[reserva.estadoDeReserva] || reserva.estadoDeReserva}
                    </Badge>
                    {completado && (
                      <Badge variant="success">Pagado</Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-2">
                    {act?.nombre || 'Actividad'}
                  </h3>

                  {act && (
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(act.fechaYHora)}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(act.fechaYHora)}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-dark dark:text-gray-100 mb-4 space-y-1">
                    <p>
                      Pagado: <span className="font-semibold">${pagado.toFixed(2)}</span>
                      {' / '}
                      <span className="font-semibold">${reserva.montoTotal.toFixed(2)}</span>
                    </p>
                    {!completado && (
                      <p className="text-gray-500 dark:text-gray-400">
                        Saldo pendiente: <span className="font-medium">${reserva.montoPendiente.toFixed(2)}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    {(reserva.estadoDeReserva === 'PendienteDePago' || (reserva.estadoDeReserva === 'Activa' && !completado)) && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePagar(reserva)}
                      >
                        {reserva.estadoDeReserva === 'PendienteDePago' ? 'Pagar' : 'Pagar saldo'}
                      </Button>
                    )}
                    {(reserva.estadoDeReserva === 'PendienteDePago' || reserva.estadoDeReserva === 'Activa' || reserva.estadoDeReserva === 'EnEspera') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                        loading={cancelandoId === reserva.id}
                        onClick={() => handleCancelClick(reserva)}
                      >
                        Cancelar
                      </Button>
                    )}
                    {reserva.estadoDeReserva === 'Activa' && completado && (
                      <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 rounded-xl">
                        Completado
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmActionModal
        isOpen={showConfirmCancel}
        title="Cancelar reserva"
        body="¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer."
        confirmLabel="Cancelar reserva"
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setShowConfirmCancel(false);
          setSelectedReserva(null);
        }}
      />

      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </MainLayout>
  );
}
