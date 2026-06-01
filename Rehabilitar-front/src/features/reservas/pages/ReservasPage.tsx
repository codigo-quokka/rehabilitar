import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Button, Input, FilterDropdown } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { reservasApi, actividadesApi } from '../../../api';
import { Reserva, Actividad } from '../../../types';
import { Notitoast } from '../../../components/Notitoast';
import { ConfirmActionModal } from '../../../components/ConfirmActionModal';

const estadoLabel: Record<string, string> = {
  PendienteDePago: 'Señada',
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
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('usuarioId');
  const targetName = searchParams.get('nombre');
  const effectiveUserId = targetUserId ?? user?.id;
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [actividades, setActividades] = useState<Record<string, Actividad>>({});
  const [loading, setLoading] = useState(true);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState({
    estadoDeReserva: 'all',
    pagado: 'all',
  });

  const successMessageHandled = useRef(false);

  const fetchReservas = useCallback(async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    try {
      const [res, acts] = await Promise.all([
        reservasApi.getAll({ usuarioId: effectiveUserId }),
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
  }, [effectiveUserId]);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas, location.state?._refresh]);

  useEffect(() => {
    if (successMessageHandled.current) return;
    const msg = (location.state as Record<string, unknown> | null)?._successMessage;
    if (typeof msg === 'string') {
      successMessageHandled.current = true;
      setToastType('success');
      setToastMessage(msg);
      setShowToast(true);
    }
  }, [location.state]);

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
    const reservaId = selectedReserva.id;
    const actividadId = selectedReserva.actividadId;
    setCancelandoId(reservaId);
    setShowConfirmCancel(false);
    try {
      await reservasApi.cancelar(reservaId, actividadId);
      setReservas((prev) => prev.map((r) => r.id === reservaId ? { ...r, estadoDeReserva: 'Cancelada' } : r));
      window.dispatchEvent(new CustomEvent('rehabicoins:refresh'));
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

  const filteredReservas = reservas.filter(r => {
    if (filters.estadoDeReserva !== 'all' && r.estadoDeReserva !== filters.estadoDeReserva) return false;
    if (filters.pagado === 'pagados' && r.montoPendiente !== 0) return false;
    if (filters.pagado === 'pendientes' && r.montoPendiente === 0) return false;
    if (dateFrom || dateTo) {
      const act = actividades[r.actividadId];
      if (act) {
        const actDate = new Date(act.fechaYHora);
        if (dateFrom && actDate < new Date(dateFrom)) return false;
        if (dateTo && actDate > new Date(dateTo + 'T23:59:59')) return false;
      }
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const act = actividades[r.actividadId];
      if (!act?.nombre.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const displayReservas = useMemo(() => {
    const byDate = (r: Reserva) => new Date(actividades[r.actividadId]?.fechaYHora ?? 0).getTime();
    const sorted = [...filteredReservas].sort((a, b) => byDate(a) - byDate(b));
    if (filters.estadoDeReserva === 'Cancelada') return sorted;
    let cancelCount = 0;
    return sorted.filter(r => {
      if (r.estadoDeReserva === 'Cancelada') {
        cancelCount++;
        return cancelCount <= 5;
      }
      return true;
    });
  }, [filteredReservas, filters.estadoDeReserva, actividades]);

  const hasActiveFilters = useMemo(() => {
    return (
      !!dateFrom ||
      !!dateTo ||
      Object.values(filters).some(v => v !== 'all')
    );
  }, [dateFrom, dateTo, filters]);

  const hasActiveSearchFilter = useMemo(() => {
    return (
      searchTerm !== ''
    );
  }, [searchTerm]);

  const getEmptyStateMessage = () => {
    if (hasActiveSearchFilter && hasActiveFilters) {
      return `No se encontraron coincidencias con los filtros de búsqueda seleccionados y la búsqueda "${searchTerm}".`
    }
    if (hasActiveSearchFilter) {
      return `No se encontraron coincidencias con la búsqueda "${searchTerm}".`
    }
    if (hasActiveFilters) {
      return 'No se encontraron coincidencias con los filtros de búsqueda seleccionados.'
    }
    return 'No se realizaron reservas.'
  }

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const cleanFilters = () => {
    setFilters({
      estadoDeReserva: 'all',
      pagado: 'all',
    });
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
  };

  const getRefundMessage = (reserva: Reserva | null) => {
    if (!reserva) return '';
    const act = actividades[reserva.actividadId];
    if (!act) return '';

    const diffHours = (new Date(act.fechaYHora).getTime() - new Date().getTime()) / (1000 * 60 * 60);

    if (reserva.tipoCliente === 'Abonado') {
      if (diffHours >= 48) {
        return 'Se te devolverá 1 RehabiliCoin.';
      } else {
        return 'No se te devolverá el RehabiliCoin por cancelar con menos de 48hs de anticipación.';
      }
    } else {
      if (diffHours >= 24) {
        return 'Se te reembolsará el dinero pagado.';
      } else {
        return 'No se te reembolsará el dinero por cancelar con menos de 24hs de anticipación.';
      }
    }
  };


  return (
    <MainLayout title={targetName ? `Reservas de ${targetName}` : 'Mis reservas'}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por actividad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-125 h-12"
            />
            <Button
              variant="primary"
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className="border-none gap-2 h-12"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
                Filtros
              <svg className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        </div>

        <FilterDropdown
          inline
          open={filterOpen}
          filters={[
            {
              key: 'estadoDeReserva',
              label: 'Estado',
              options: [
                { value: 'all', label: 'Todos' },
                { value: 'PendienteDePago', label: 'Pendiente de pago' },
                { value: 'Activa', label: 'Activa' },
                { value: 'EnEspera', label: 'En espera' },
                { value: 'Cancelada', label: 'Cancelada' },
              ],
            },
            {
              key: 'pagado',
              label: 'Pago',
              options: [
                { value: 'all', label: 'Todos' },
                { value: 'pagados', label: 'Pagados' },
                { value: 'pendientes', label: 'Pendientes' },
              ],
            },
          ]}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onApply={() => {
            setFilters({ estadoDeReserva: 'all', pagado: 'all' });
            setDateFrom('');
            setDateTo('');
          }}
        >
          <div className="flex flex-col">
            <label className="text-sm font-medium text-dark dark:text-gray-100 mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              min={todayStr}
              className="w-32 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-dark dark:text-gray-100 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-dark dark:text-gray-100 mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || todayStr}
              className="w-32 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-dark dark:text-gray-100 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </FilterDropdown>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
) : displayReservas.length === 0 ? (
  <Card>
    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
      {getEmptyStateMessage()}
    </p>
    {(hasActiveFilters || hasActiveSearchFilter) && (
      <div className="flex justify-center mt-4">
        <Button
          variant="ghost"
          className="px-4 py-2 justify-center whitespace-nowrap h-10 hover:bg-primary/20 dark:hover:bg-gray-700 transition-colors"
          onClick={() => {
          cleanFilters();
        }}
        >
          Limpiar filtros
        </Button>
      </div>
    )}
  </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayReservas.map((reserva) => {
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
                        variant="danger"
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
        body={`¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer. ${getRefundMessage(selectedReserva)}`}
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
