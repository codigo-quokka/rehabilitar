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

  const state = location.state as {
    reservaId?: string;
    actividadId?: string;
    montoTotal: number;
    montoPagado?: number;
    montoPendiente: number;
    intencionId?: string;
    actividades?: Actividad[];
  } | null;

  const isIntent = !!intencionId;
  const isPackage = isIntent && (state?.actividades?.length ?? 0) > 1;

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [monto, setMonto] = useState<number>(state?.montoPendiente ?? state?.montoTotal ?? 0);
  const [metodoPago, setMetodoPago] = useState('MercadoPago');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const processingRef = useRef(false);

  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!state || isPackage) return;
    const fetchActividad = async () => {
      try {
        const act = await actividadesApi.getById(state.actividadId!);
        setActividad(act);
      } catch {
        // Activity name not critical for payment flow
      }
    };
    fetchActividad();
  }, [state, isPackage]);

  if (!state) {
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

  const montoTotal = state.montoTotal ?? 0;
  const montoPagado = state.montoPagado ?? 0;
  const montoPendiente = state.montoPendiente ?? montoTotal;
  const depositoMinimo = montoTotal / 2;
  const confirmaReserva = !isPackage && montoPagado < depositoMinimo && (montoPagado + monto) >= depositoMinimo;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const esMercadoPago = metodoPago === 'MercadoPago';
  const montoMinimoMP = isPackage ? montoTotal : montoTotal / 2;

  const efectuarPago = async (amount: number) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLoading(true);
    try {
      await reservasApi.registrarPago(reservaId!, {
        actividadId: state.actividadId!,
        metodoPago,
        monto: amount,
      });

      const reservaActualizada = await reservasApi.getById(reservaId!);
      const nuevoEstado = reservaActualizada.estadoDeReserva;
      const completado = reservaActualizada.montoPendiente === 0;

      if (completado) {
        addNotification('¡Pago completo! Tu reserva está totalmente saldada.', 'success');
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
        addNotification(isPackage ? 'El monto debe ser el total del paquete.' : 'El monto mínimo para pagar con Mercado Pago es el 50% del valor de la actividad.', 'error');
        return;
      }
      if (monto > montoPendiente) {
        addNotification('El monto no puede exceder el saldo pendiente', 'error');
        return;
      }

      setLoading(true);
      try {
        const url = isIntent ? '/pagos/mercadopago/preferencia-paquete/' + intencionId : '/pagos/mercadopago/preferencia';
        const body = isIntent ? { monto } : { reservaId };
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

  const hayListaEspera = isPackage && state.actividades?.some(a => a.probabilidadListaEspera === true);

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
                  <span className="font-medium text-dark dark:text-gray-100 text-right">{isPackage ? `Paquete de ${state?.actividades?.length} clases` : 'Reserva de clase'}</span>
                </div>
                {state.actividades?.map((act, i) => (
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
                {confirmaReserva
                  ? 'Este pago confirmará tu reserva y asegurará tu lugar.'
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
                  disabled={isPackage}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isPackage ? 'Monto total del paquete' : `Monto mínimo: $${montoMinimoMP.toFixed(2)} — Monto máximo: $${montoPendiente.toFixed(2)}`}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
                Se utilizará 1 RehabiliCoin completo por esta actividad.
              </p>
            )}

            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-gray-500 dark:text-gray-400">Total a pagar ahora</span>
              <span className="text-lg font-bold text-primary">
                ${(esMercadoPago ? monto : montoPendiente).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            loading={deleting}
            onClick={async () => {
              if (isIntent && intencionId) {
                setDeleting(true);
                try {
                  await reservasApi.eliminarIntencion(intencionId);
                  addNotification('Intención de pago cancelada.', 'info');
                } catch {
                  // Even if delete fails, navigate away
                } finally {
                  setDeleting(false);
                  navigate('/reservas');
                }
              } else {
                navigate('/reservas');
              }
            }}
          >
            {isIntent ? 'Cancelar y volver' : 'Volver'}
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            loading={loading}
            disabled={esMercadoPago ? (monto < montoMinimoMP || monto > montoPendiente) : false}
            onClick={handleRealizarPago}
          >
            {esMercadoPago ? 'Mercado Pago' : 'Realizar Pago'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
