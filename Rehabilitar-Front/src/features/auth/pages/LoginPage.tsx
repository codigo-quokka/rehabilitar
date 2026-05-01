import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Card } from "../../../components/ui";
import { useAuth } from "../../../hooks/useAuth";
import logo from "../../../assets/logo.png";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-bg-main via-bg-secondary to-bg-surface flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img
            src={logo}
            alt="RehabilitAR"
            className="w-24 h-auto mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-dark">RehabilitAR</h1>
          <p className="text-gray-500 mt-2 text-lg">Centro de Rehabilitación</p>
        </div>

        <Card className="shadow-xl">
          <div className="p-2">
            <h2 className="text-2xl font-semibold text-dark mb-8">
              Bienvenido
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />

              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <div className="flex justify-end">
                <Link
                  to="/recover"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full py-3 text-base"
                loading={loading}
              >
                Iniciar sesión
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-gray-500">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Regístrate
                </Link>
              </p>
            </div>
          </div>
        </Card>

        <p className="text-center text-gray-400 text-sm mt-8">
          © 2026 RehabilitAR
        </p>
      </div>
    </div>
  );
}
