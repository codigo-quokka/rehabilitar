import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Card } from "../../../components/ui";
import { Notitoast } from "../../../components/Notitoast";
import { authApi } from "../../../api";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications";
import logo from "../../../assets/logo.png";
import axios from "axios";

export function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    telefono: "",
    dni: "",
    fechaNacimiento: "",
  });
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const MIN_PASSWORD_LENGTH = 6;
  const MIN_DNI_LENGTH = 7;
  const MAX_DNI_LENGTH = 8;

  
  useEffect(() => {
    
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (showToast) {
      const timer = setTimeout(() => {
        if (toastType === "success") {
          navigate("/login");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAuthenticated, showToast, toastType, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowToast(false);

    if (formData.password !== formData.confirmPassword) {
      const msg = "Las contraseñas no coinciden. Por favor, ingrésalas de nuevo.";
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      addNotification(msg, "error");
      return;
    }

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      const msg = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      addNotification(msg, "error");
      return;
    }

    if (formData.dni.length < MIN_DNI_LENGTH || formData.dni.length > MAX_DNI_LENGTH) {
      const msg = `El DNI ingresado es incorrecto.`;
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      addNotification(msg, "error");
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
      const msg = "Cuenta creada correctamente. Redirigiendo...";
      setToastType("success");
      setToastMessage(msg);
      setShowToast(true);
      addNotification(msg, "success");
    } catch (err: unknown) {
      let msg = "Error al registrar usuario. Intenta de nuevo.";

      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.error ?? msg;
      }

      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      addNotification(msg, "error");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-bg-main via-bg-secondary to-bg-surface flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <img
              src={logo}
              alt="RehabilitAR"
              className="w-24 h-auto mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold text-dark">RehabilitAR</h1>
            <p className="text-gray-500 mt-2 text-lg">
              Centro de Rehabilitación
            </p>
          </div>

          <Card className="shadow-xl">
            <div className="p-2">
              <h2 className="text-2xl font-semibold text-dark mb-8">
                Crear cuenta
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                  label="Teléfono *"
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="+54 221 123 4567"              
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="DNI"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    placeholder="12345678"
                    required
                    minLength={MIN_DNI_LENGTH}
                    maxLength={MAX_DNI_LENGTH}
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
                  minLength={MIN_PASSWORD_LENGTH}
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

                <Button
                  type="submit"
                  className="w-full py-3 text-base"
                  loading={loading}
                  disabled={loading}
                >
                  Crear cuenta
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-gray-500">
                  ¿Ya tienes cuenta?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Iniciar sesión
                  </Link>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
