import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../../../components/ui';
import { authApi } from '../../../api';
import logo from '../../../assets/logo.png';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    telefono: '',
    dni: '',
    fechaNacimiento: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dni: formData.dni,
        fechaNacimiento: formData.fechaNacimiento,
        telefono: formData.telefono || undefined,
      });
      navigate('/login');
    } catch {
      setError('Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-main via-bg-secondary to-bg-surface flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src={logo} alt="RehabilitAR" className="w-24 h-auto mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-dark">RehabilitAR</h1>
          <p className="text-gray-500 mt-2 text-lg">Centro de Rehabilitación</p>
        </div>

        <Card className="shadow-xl">
          <div className="p-2">
            <h2 className="text-2xl font-semibold text-dark mb-8">Crear cuenta</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Juan"
                  required
                />
                <Input
                  label="Apellido"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Pérez"
                  required
                />
              </div>

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
              />

              <Input
                label="Teléfono"
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+54 11 1234 5678"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="DNI"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  placeholder="12345678"
                  required
                />
                <Input
                  label="Fecha de nacimiento"
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input
                label="Contraseña"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              <Button type="submit" className="w-full py-3 text-base" loading={loading}>
                Crear cuenta
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}