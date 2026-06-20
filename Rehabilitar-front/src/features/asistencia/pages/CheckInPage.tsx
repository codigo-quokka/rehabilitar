import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { actividadesApi } from '../../../api';
import { Notitoast } from '../../../components/Notitoast';

export function CheckInPage() {
  const { actividadId } = useParams<{ actividadId: string }>();
  const [nombre, setNombre] = useState('');
  const [loadingAct, setLoadingAct] = useState(true);
  const [dni, setDni] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [registrado, setRegistrado] = useState(false);

  useEffect(() => {
    if (!actividadId) return;
    actividadesApi.getById(actividadId)
      .then((act) => setNombre(act.nombre))
      .catch(() => setNombre('Actividad'))
      .finally(() => setLoadingAct(false));
  }, [actividadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividadId || !dni.trim()) return;

    setSubmitting(true);
    try {
      await actividadesApi.checkIn(actividadId, dni.trim());
      setToast({ type: 'success', message: 'Asistencia registrada correctamente' });
      setRegistrado(true);
      setDni('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err as Error)?.message ||
        'Error al registrar asistencia';
      setToast({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-main via-bg-secondary to-bg-surface dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-dark dark:text-gray-100 mb-2">
              {loadingAct ? 'Cargando...' : nombre}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Ingresá tu DNI para registrar tu asistencia
            </p>
          </div>

          {registrado ? (
            <div className="text-center">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  Asistencia registrada con éxito
                </p>
              </div>
              <Link
                to="/"
                className="text-primary hover:text-primary-dark dark:text-primary-400 text-sm font-medium transition-colors"
              >
                Volver al inicio
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-dark dark:text-gray-300 mb-1.5">
                  DNI
                </label>
                <input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  value={dni}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 8) setDni(val);
                  }}
                  placeholder="Ingresá tu número de DNI"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-dark dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || dni.length < 7}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark dark:bg-primary dark:hover:bg-primary-dark text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                {submitting ? 'Registrando...' : 'Registrar asistencia'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          RehabilitAR — Sistema de Asistencia
        </p>
      </div>

      {toast && (
        <Notitoast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
