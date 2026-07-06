import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '../../../components/ui';
import { authApi } from '../../../api';
import { Notitoast } from '../../../components/Notitoast';
import { useInputFilter } from '../../../hooks/useInputFilter';
import { INPUT_PRESETS } from '../../../utils/inputPresets';

export function PasswordRecoveryPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");
  const handleCloseToast = useCallback(() => setShowToast(false), []);

  const emailFilter = useInputFilter(email, (v) => setEmail(v), INPUT_PRESETS.email);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      setLoading(false);
      setToastType("error");
      setToastMessage("Por favor, ingresa tu email");
      setShowToast(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoading(false);
      setToastType("error");
      setToastMessage("Por favor, ingresa un email válido");
      setShowToast(true);
      return;
    }

    try {
      await authApi.recoverPassword(email);
    } catch (err) {
      // Ignore error to prevent email enumeration
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bg-main dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark dark:text-gray-100 mb-2">Revisa tu email</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Te hemos enviado un enlace para recuperar tu contraseña
          </p>
          <Link to="/login" className="text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-linear-to-br from-dark-green/10 from-10% via-dark-green/30 via-50% to-dark-green/40 to-70% dark:from-0% dark:via-45% dark:to-90% dark:from-gray-700 dark:via-gray-950 dark:to-gray-900 bg-fixed flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark-green">RehabilitAR</h1>
          <p className="font-semibold text-dark dark:text-gray-400 mt-2">Centro de Rehabilitación</p>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-dark dark:text-gray-100 mb-2">Recuperar contraseña</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value.replace(INPUT_PRESETS.email.cleanPasteRegex, ''))}
                onKeyDown={emailFilter.handleKeyDown}
                onPaste={emailFilter.handlePaste}
                placeholder="tu@email.com"
              />

            <Button type="submit" className="w-full" loading={loading}>
              Enviar enlace
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <span onClick={() => (window.location.href = '/login')} className="text-dark-green dark:text-primary hover:underline font-medium cursor-pointer">
              Volver a iniciar sesión
            </span>
          </div>
        </Card>
      </div>
      {showToast && (
      <Notitoast type={toastType} message={toastMessage} onClose={handleCloseToast} />
      )}
    </div>
  );
}