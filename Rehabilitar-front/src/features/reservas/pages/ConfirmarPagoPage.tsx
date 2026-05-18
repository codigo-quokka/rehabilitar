import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MainLayout } from '../../../components/layout';
import { Card, Button, Input, Select } from '../../../components/ui';
import { reservasApi, actividadesApi } from '../../../api';
import { Actividad, Reserva } from '../../../types';
import { Notitoast } from '../../../components/Notitoast';
import { MercadoFake } from '../../../components/MercadoFake';

const metodoPagoOptions = [
  { value: 'MercadoPago', label: 'Mercado Pago' },
  { value: 'RehabiliCoins', label: 'RehabiliCoins' },
];

export function ConfirmarPagoPage() {
  const { reservaId } = useParams<{ reservaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    reservaId: string;
    actividadId: string;
    montoTotal: number;
    montoPagado: number;
    montoPendiente: number;
  } | null;

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [monto, setMonto] = useState<number>(state?.montoPendiente ?? 0);
  const [metodoPago, setMetodoPago] = useState('MercadoPago');
  const [loading, setLoading] = useState(false);

  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [showMercadoFake, setShowMercadoFake] = useState(false);

  useEffect(() => {
    if (!state) return;
    const fetchActividad = async () => {
      try {
        const act = await actividadesApi.getById(state.actividadId);
        setActividad(act);
      } catch {
        // Activity name not critical for payment flow
      }
    };
    fetchActividad();
  }, [state]);

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

  const { montoTotal, montoPagado, montoPendiente } = state;
  const nuevoTotalPagado = montoPagado + monto;
  const depositoMinimo = montoTotal / 2;
  const confirmaReserva = montoPagado < depositoMinimo && nuevoTotalPagado >= depositoMinimo;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const esMercadoPago = metodoPago === 'MercadoPago';
  const montoMinimoMP = montoTotal / 2;

  const efectuarPago = async (amount: number) => {
    setLoading(true);
    try {
      await reservasApi.registrarPago(reservaId!, {
        actividadId: state.actividadId,
        metodoPago,
        monto: amount,
      });

      const reservaActualizada = await reservasApi.getById(reservaId!);
      const nuevoEstado = reservaActualizada.estadoDeReserva;
      const completado = reservaActualizada.montoPendiente === 0;

      if (completado) {
        setToastType('success');
        setToastMessage('¡Pago completo! Tu reserva está totalmente saldada.');
      } else if (nuevoEstado === 'Activa') {
        setToastType('success');
        setToastMessage('¡Reserva confirmada! Tu lugar está asegurado.');
      } else if (nuevoEstado === 'EnEspera') {
        setToastType('success');
        setToastMessage('Pago registrado. Quedaste en lista de espera.');
      } else {
        setToastType('success');
        setToastMessage('Pago registrado correctamente.');
      }
      setShowToast(true);

      setTimeout(() => {
        navigate('/reservas', { replace: true });
      }, 1500);
    } catch (err) {
      const apiError = (err as { response?: { data?: { errorCode?: string; error?: string } } })?.response?.data;
      const msg = apiError?.errorCode ?? apiError?.error ?? 'Error al procesar el pago';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMercadoFakeSuccess = (reservaActualizada: Reserva) => {
    setShowMercadoFake(false);
    const completado = reservaActualizada.montoPendiente === 0;

    if (completado) {
      setToastType('success');
      setToastMessage('¡Pago completo! Tu reserva está totalmente saldada.');
    } else if (reservaActualizada.estadoDeReserva === 'Activa') {
      setToastType('success');
      setToastMessage('¡Reserva confirmada! Tu lugar está asegurado.');
    } else if (reservaActualizada.estadoDeReserva === 'EnEspera') {
      setToastType('success');
      setToastMessage('Pago registrado. Quedaste en lista de espera.');
    } else {
      setToastType('success');
      setToastMessage('Pago registrado correctamente.');
    }
    setShowToast(true);

    setTimeout(() => {
      navigate('/reservas', { replace: true });
    }, 1500);
  };

  const handleMercadoPagoRedirect = () => {
    if (monto < montoMinimoMP) {
      setToastType('error');
      setToastMessage('El monto mínimo para pagar con Mercado Pago es el 50% del valor de la actividad.');
      setShowToast(true);
      return;
    }
    if (monto > montoPendiente) {
      setToastType('error');
      setToastMessage('El monto no puede exceder el saldo pendiente');
      setShowToast(true);
      return;
    }
    setShowMercadoFake(true);
  };

  const handleRealizarPago = async () => {
    const amountToPay = esMercadoPago ? monto : montoPendiente;

    if (esMercadoPago) {
      handleMercadoPagoRedirect();
      return;
    }

    efectuarPago(amountToPay);
  };

  return (
    <MainLayout title="Confirmar pago">
      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <h2 className="text-xl font-semibold text-dark dark:text-gray-100 mb-4">Resumen de pago</h2>

          <div className="space-y-3 text-sm">
            {actividad && (
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
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Ya pagado</span>
              <span className="font-medium text-dark dark:text-gray-100">${montoPagado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-dark dark:text-gray-100 font-semibold">Saldo pendiente</span>
              <span className="font-bold text-primary">${montoPendiente.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {confirmaReserva
                ? 'Este pago confirmará tu reserva y asegurará tu lugar.'
                : 'Para confirmar la reserva se requiere pagar al menos el 50% del total ($' + depositoMinimo.toFixed(2) + ').'
              }
            </p>
          </div>
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
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Monto mínimo: ${montoMinimoMP.toFixed(2)} — Monto máximo: ${montoPendiente.toFixed(2)}
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
            variant="ghost"
            className="flex-1 text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => navigate('/reservas')}
          >
            Volver
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={loading}
            disabled={esMercadoPago ? (monto < montoMinimoMP || monto > montoPendiente) : false}
            onClick={handleRealizarPago}
          >
            Realizar Pago
          </Button>
        </div>
      </div>

      <MercadoFake
        isOpen={showMercadoFake}
        onClose={() => setShowMercadoFake(false)}
        amount={monto}
        reservaId={reservaId!}
        actividadId={state.actividadId}
        metodoPago={metodoPago}
        onSuccess={handleMercadoFakeSuccess}
        onError={(msg) => {
          setShowMercadoFake(false);
          setToastType('error');
          setToastMessage(msg);
          setShowToast(true);
        }}
        activityName={actividad?.nombre}
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
