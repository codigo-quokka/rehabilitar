import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { actividadesApi } from '../../../api';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';

interface ActividadData {
  id: string;
  nombre: string;
  descripcion: string;
  fechaYHora: string;
  estado: string;
  nombreSala: string;
}

type Status = 'loading' | 'not-found' | 'too-early' | 'waiting-start' | 'ready' | 'ended' | 'success';

export default function AsistenciaPage() {
  const { actividadId } = useParams<{ actividadId: string }>();
  const { isAuthenticated, user } = useAuth();
  const { addNotification } = useNotifications();

  const [actividad, setActividad] = useState<ActividadData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [dni, setDni] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!actividadId) return;

    const fetchAndSetStatus = async () => {
      try {
        const act = await actividadesApi.getById(actividadId);
        setActividad(act);

        const now = new Date();
        const startTime = new Date(act.fechaYHora);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        if (act.estado === 'Finalizada' || now >= endTime) {
          setStatus('ended');
        } else if (now < startTime) {
          setStatus('too-early');
        } else if (act.estado === 'EnCurso') {
          setStatus('ready');
        } else {
          setStatus('waiting-start');
        }
      } catch {
        setStatus('not-found');
      }
    };

    fetchAndSetStatus();
  }, [actividadId]);

  // Auto-retry: when waiting for start, poll every 5 seconds
  useEffect(() => {
    if (status !== 'waiting-start') return;
    const interval = setInterval(() => {
      if (!actividadId) return;
      actividadesApi.getById(actividadId).then(act => {
        setActividad(act);
        if (act.estado === 'EnCurso') {
          setStatus('ready');
        }
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [status, actividadId]);

  const handleConfirmarAsistencia = async () => {
    if (!actividadId) return;
    setSubmitting(true);
    try {
      await actividadesApi.confirmarAsistencia(actividadId);
      setStatus('success');
      setMensaje('Asistencia registrada correctamente');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al registrar asistencia';
      addNotification(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegistrarAsistencia = async () => {
    if (!actividadId || !dni.trim()) return;
    setSubmitting(true);
    try {
      await actividadesApi.registrarAsistencia(actividadId, dni.trim());
      setStatus('success');
      setMensaje('Asistencia registrada correctamente');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al registrar asistencia';
      addNotification(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Actividad no encontrada</h1>
          <p className="text-gray-600 dark:text-gray-300">El código QR escaneado no corresponde a una actividad válida.</p>
        </div>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Actividad finalizada</h1>
          <p className="text-gray-600 dark:text-gray-300">Esta actividad ya ha finalizado.</p>
        </div>
      </div>
    );
  }

  if (status === 'too-early') {
    const startTime = actividad ? new Date(actividad.fechaYHora) : new Date();
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{actividad?.nombre}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            La actividad comenzará a las{' '}
            <strong>{startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong>.
          </p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Vuelve a escanear cuando el profesor lo indique.</p>
        </div>
      </div>
    );
  }

  if (status === 'waiting-start') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{actividad?.nombre}</h1>
          <p className="text-gray-600 dark:text-gray-300">Esperando a que el profesor inicie la clase...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">¡Asistencia registrada!</h1>
          <p className="text-gray-600 dark:text-gray-300">{mensaje}</p>
        </div>
      </div>
    );
  }

  // status === 'ready'
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">{actividad?.nombre}</h1>
        {actividad?.nombreSala && (
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">{actividad.nombreSala}</p>
        )}

        {isAuthenticated && user?.rol === 'Cliente Registrado' ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¿Confirmar asistencia de <strong>{user.nombre} {user.apellido}</strong>?
            </p>
            <button
              onClick={handleConfirmarAsistencia}
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {submitting ? 'Registrando...' : 'Confirmar asistencia'}
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ingresá tu número de documento
            </label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="DNI"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleRegistrarAsistencia()}
            />
            <button
              onClick={handleRegistrarAsistencia}
              disabled={submitting || !dni.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {submitting ? 'Registrando...' : 'Registrar asistencia'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
