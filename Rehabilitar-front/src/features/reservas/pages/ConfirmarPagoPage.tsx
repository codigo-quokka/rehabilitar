import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MainLayout } from '../../../components/layout';
import { Card, Button, Input, Select } from '../../../components/ui';
import { reservasApi, actividadesApi, apiClient } from '../../../api';
import { Actividad } from '../../../types';
import { useNotifications } from '../../../hooks/useNotifications';

const metodoPagoOptions = [
  { value: 'MercadoPago', label: 'Mercado Pago' },
  { value: 'RehabiliCoins', label: 'RehabiliCoins' },
];

export function ConfirmarPagoPage() {
  const { reservaId, intencionId } = useParams<{ reservaId?: string, intencionId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = location.state as {
    reservaId?: string;
    actividadId?: string;
    montoTotal: number;
    montoPagado?: number;
    montoPendiente: number;
    intencionId?: string;
    actividades?: Actividad[];
  } | null;

  // Safe state accessors - return defaults if state is null
  const stateMontoTotal = locationState?.montoTotal ?? 0;
  const stateMontoPagado = locationState?.montoPagado ?? 0;
  const stateMontoPendiente = locationState?.montoPendiente ?? 0;
  const stateActividadId = locationState?.actividadId;
  const actividades = locationState?.actividades;

  const isIntent = !!intencionId;
  const isPackage = isIntent && (actividades?.length ?? 0) > 1;

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [recoveredData, setRecoveredData] = useState<{
    montoTotal: number;
    montoPagado: number;
    montoPendiente: number;
    actividadId?: string;
  } | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [monto, setMonto] = useState<number>(stateMontoPendiente || stateMontoTotal || 0);
  const [metodoPago, setMetodoPago] = useState('MercadoPago');
  const [loading, setLoading] = useState(false);
  const processingRef = useRef(false);

  const { addNotification } = useNotifications();

  // Recovery effect: if location.state is lost (e.g. page refresh), try to load from API
  useEffect(() => {
    if (locationState) return; // State available, no recovery needed
    
    const recoverFromApi = async () => {
      setRecoveryLoading(true);
      try {
        if (reservaId) {
          // For existing reservation: can fully recover from API
          const reserva = await reservasApi.getById(reservaId);
          const montoPagado = reserva.montoTotal - reserva.montoPendiente;
          setRecoveredData({
            montoTotal: reserva.montoTotal,
            montoPagado,
            montoPendiente: reserva.montoPendiente,
            actividadId: reserva.actividadId,
          });
          setMonto(reserva.montoPendiente);
          // Also load the actividad for display
          try {
            const act = await actividadesApi.getById(reserva.actividadId);
            setActividad(act);
          } catch { /* non-critical */ }
        } else if (intencionId) {
          // For intent flows: can't fully recover without backend support
          // Show a message directing user to go back
          setRecoveredData({ montoTotal: 0, montoPagado: 0, montoPendiente: 0 });
        }
      } catch {
        setRecoveredData({ montoTotal: 0, montoPagado: 0, montoPendiente: 0 });
      } finally {
        setRecoveryLoading(false);
      }
    };
    
    recoverFromApi();
  }, [reservaId, intencionId]); // Note: no locationState dependency - runs once

  useEffect(() => {
    if (!locationState || isPackage) return;
    const fetchActividad = async () => {
      try {
        const act = await actividadesApi.getById(stateActividadId!);
        setActividad(act);
      } catch {
        // Activity name not critical for payment flow
      }
    };
    fetchActividad();
  }, [locationState, isPackage, stateActividadId]);

  if (!locationState && recoveryLoading) {
    return (
      <MainLayout title="Recuperando información...">
        <Card>
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
            <p className="text-gray-500 dark:text-gray-400">Recuperando información de tu reserva...</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (!locationState && !recoveredData) {
    return (
      <MainLayout title="Confirmar pago">
        <Card>
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No se encontró información de la reserva.
          </p>
          <div className="flex justify-center mt-4">
            <Button variant="ghost" className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => navigate('/reservas')}>
              Volver a mis reservas
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  const montoTotal = locationState?.montoTotal ?? recoveredData?.montoTotal ?? 0;
  const montoPagado = locationState?.montoPagado ?? recoveredData?.montoPagado ?? 0;
  const montoPendiente = locationState?.montoPendiente ?? recoveredData?.montoPendiente ?? montoTotal;
  const actividadIdValue = locationState?.actividadId ?? recoveredData?.actividadId ?? '';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const esMercadoPago = metodoPago === 'MercadoPago';

  // Calcula el monto mínimo permitido para MercadoPago según el tipo de operación
  const calcularMontoMinimoMP = (): number => {
    if (isPackage) return montoTotal;            // Paquete: debe pagarse completo
    if (montoPagado > 0) return montoPendiente;  // Pago parcial existente: debe saldar el resto
    return montoTotal / 2;                       // Pago inicial: mínimo 50% (seña)
  };

  const montoMinimoMP = calcularMontoMinimoMP();
  const depositoMinimo = montoTotal / 2;

  // Indica si con este pago se alcanza el depósito mínimo (50%) para confirmar la reserva
  const confirmaReserva = !isPackage && montoPagado < depositoMinimo && (montoPagado + monto) >= depositoMinimo;

  const efectuarPago = async (amount: number) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLoading(true);
    try {
      await reservasApi.registrarPago(reservaId!, {
        actividadId: actividadIdValue,
        metodoPago,
        monto: amount,
      });

      const reservaActualizada = await reservasApi.getById(reservaId!);
      const nuevoEstado = reservaActualizada.estadoDeReserva;
      const completado = reservaActualizada.montoPendiente === 0;

      if (completado) {
        const msg = metodoPago === 'RehabiliCoins' && montoPagado > 0
          ? '¡Pago completo! El depósito fue reembolsado a tu saldo a favor y la reserva está totalmente saldada.'
          : '¡Pago completo! Tu reserva está totalmente saldada.';
        addNotification(msg, 'success');
      } else if (nuevoEstado === 'Activa') {
        addNotification('¡Reserva confirmada! Tu lugar está asegurado.', 'success');
      } else if (nuevoEstado === 'EnEspera') {
        addNotification('Pago registrado. Quedaste en lista de espera.', 'success');
      } else {
        addNotification('Pago registrado correctamente.', 'success');
      }

      setTimeout(() => {
        navigate('/reservas', { replace: true });
      }, 1500);
    } catch (err) {
      const apiError = (err as { response?: { data?: { errorCode?: string; error?: string } } })?.response?.data;
      const msg = apiError?.errorCode ?? apiError?.error ?? 'Error al procesar el pago';
      addNotification(msg, 'error');
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  const handleRealizarPago = async () => {
    const amountToPay = esMercadoPago ? monto : montoPendiente;

    if (esMercadoPago) {
      if (monto < montoMinimoMP) {
        const msg = isPackage
          ? 'El monto debe ser el total del paquete.'
          : montoPagado > 0
            ? 'Debes saldar el total restante de una vez.'
            : `El monto mínimo para señar es $${montoMinimoMP.toFixed(2)}.`;
        addNotification(msg, 'error');
        return;
      }
      if (monto > montoPendiente) {
        addNotification('El monto no puede exceder el saldo pendiente', 'error');
        return;
      }

      setLoading(true);
      try {
        const url = isIntent ? '/pagos/mercadopago/preferencia-paquete/' + intencionId : '/pagos/mercadopago/preferencia';
        const body = isIntent ? { monto } : { reservaId, monto };
        const response = await apiClient.post(url, body);
        window.location.href = response.data.initPoint;
      } catch {
        addNotification('Error al iniciar el pago con Mercado Pago', 'error');
        setLoading(false);
      }
      return;
    }

    if (isIntent) {
      if (processingRef.current) return;
      processingRef.current = true;
      setLoading(true);
      try {
        await apiClient.post(`/pagos/intencion/${intencionId}/pago-rehabilicoins`);
        addNotification('¡Pago con RehabiliCoins exitoso! Tu lugar está asegurado.', 'success');
        setTimeout(() => {
          navigate('/reservas', { replace: true });
        }, 1500);
      } catch (err) {
        const apiError = (err as { response?: { data?: { errorCode?: string; error?: string; title?: string } } })?.response?.data;
        const msg = apiError?.errorCode ?? apiError?.error ?? apiError?.title ?? 'Error al procesar el pago con RehabiliCoins';
        addNotification(msg, 'error');
      } finally {
        processingRef.current = false;
        setLoading(false);
      }
      return;
    }

    await efectuarPago(amountToPay);
  };

  const hayListaEspera = (actividades ?? [])?.some(a => a.probabilidadListaEspera === true) || actividad?.probabilidadListaEspera === true;

  return (
    <MainLayout title="Confirmar pago">
      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <h2 className="text-xl font-semibold text-dark dark:text-gray-100 mb-4">Resumen de pago</h2>

          {hayListaEspera && (
            <div className="mb-4 p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                Atención: Hay alta demanda para algunas de estas clases. Si demoras en confirmar el pago, podrías quedar en lista de espera (con prioridad de Abonado).
              </p>
            </div>
          )}

          <div className="space-y-3 text-sm">
            {isIntent ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Actividad</span>
                  <span className="font-medium text-dark dark:text-gray-100 text-right">{isPackage ? `Paquete de ${actividades?.length} clases` : 'Reserva de clase'}</span>
                </div>
                {actividades?.map((act, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{act.nombre}</span>
                    <span>{formatDate(act.fechaYHora)}</span>
                  </div>
                ))}
              </>
            ) : actividad && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Actividad</span>
                  <span className="font-medium text-dark dark:text-gray-100 text-right">{actividad.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Fecha</span>
                  <span className="font-medium text-dark dark:text-gray-100">{formatDate(actividad.fechaYHora)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Horario</span>
                  <span className="font-medium text-dark dark:text-gray-100">{formatTime(actividad.fechaYHora)}</span>
                </div>
              </>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total de la reserva</span>
              <span className="font-semibold text-dark dark:text-gray-100">${montoTotal.toFixed(2)}</span>
            </div>
            {!isPackage && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Ya pagado</span>
                <span className="font-medium text-dark dark:text-gray-100">${montoPagado.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base">
              <span className="text-dark dark:text-gray-100 font-semibold">Saldo pendiente</span>
              <span className="font-bold text-primary">${montoPendiente.toFixed(2)}</span>
            </div>
          </div>

          {!isPackage && (
            <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {!esMercadoPago && montoPagado > 0
                  ? 'Al pagar con RehabiliCoins se reembolsará tu depósito a saldo a favor y la actividad quedará totalmente saldada.'
                  : confirmaReserva
                    ? 'Este pago confirmará tu reserva y asegurará tu lugar.'
                    : montoPagado > 0
                      ? 'Ya señaste esta reserva. Debes saldar el total restante antes de que inicie la clase.'
                      : 'Para confirmar la reserva se requiere pagar al menos el 50% del total ($' + depositoMinimo.toFixed(2) + ').'
                }
              </p>
            </div>
          )}
        </Card>

        <Card>
          <div className="space-y-4">
            <Select
              label="Método de pago"
              value={metodoPago}
              onChange={(e) => {
                setMetodoPago(e.target.value);
                if (e.target.value === 'MercadoPago') {
                  setMonto(montoMinimoMP);
                }
              }}
              options={metodoPagoOptions}
              required
            />

            {esMercadoPago ? (
              <>
                <Input
                  label="Monto a pagar"
                  type="number"
                  min={montoMinimoMP}
                  max={montoPendiente}
                  step={0.01}
                  value={monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                  required
                  disabled={isPackage || montoPagado > 0}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isPackage
                    ? 'Monto total del paquete'
                    : montoPagado > 0
                      ? `Debes saldar el total restante: $${montoPendiente.toFixed(2)}`
                      : `Monto mínimo para señar: $${montoMinimoMP.toFixed(2)} — Monto máximo: $${montoPendiente.toFixed(2)}`
                  }
                </p>
              </>
            ) : (
              <div className="py-2 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isIntent
                    ? `Se utilizarán ${actividades?.length} RehabiliCoins para saldar este paquete de actividades.`
                    : 'Se utilizará 1 RehabiliCoin para saldar esta actividad.'}
                </p>
                {!isIntent && montoPagado > 0 && (
                  <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>Importante:</strong> Como ya realizaste un pago de <strong>${montoPagado.toFixed(2)}</strong>,
                      ese monto será reembolsado a tu saldo a favor y el RehabiliCoin cubrirá el total de la actividad.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-gray-500 dark:text-gray-400">Total a pagar ahora</span>
              {esMercadoPago ? (
                <span className="text-lg font-bold text-primary">
                  ${monto.toFixed(2)}
                </span>
              ) : (
                <span className="text-lg font-bold text-primary">
                  {isIntent ? actividades?.length : 1} RehabiliCoin{(isIntent && (actividades?.length ?? 0) !== 1) ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            onClick={() => navigate('/actividades')}
          >
            Volver
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            loading={loading}
            disabled={esMercadoPago ? (monto < montoMinimoMP || monto > montoPendiente) : false}
            onClick={handleRealizarPago}
          >
            {esMercadoPago ? 'Ir a Mercado Pago' : 'Realizar Pago'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
