import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '../../../components/ui';
import { authApi } from '../../../api';

export function PasswordRecoveryPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
    <div className="min-h-screen bg-bg-main dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">RehabilitAR</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Centro de Rehabilitación</p>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-dark dark:text-gray-100 mb-2">Recuperar contraseña</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />

            <Button type="submit" className="w-full" loading={loading}>
              Enviar enlace
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <Link to="/login" className="text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}