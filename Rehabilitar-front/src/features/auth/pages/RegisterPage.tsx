import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Card } from "../../../components/ui";
import { PrivacyEye } from "../../../components/PrivacyEye";
import { Notitoast } from "../../../components/Notitoast";
import { InformRequirements, type Requirement } from "../../../components/InformRequirements";
import { authApi } from "../../../api";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications";
import logo from "../../../assets/logo.png";
import axios from "axios";

const passwordReqs: Requirement[] = [
  { label: "Al menos 6 caracteres", test: (v) => v.length >= 6 },
  { label: "Al menos una minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "Al menos un número", test: (v) => /[0-9]/.test(v) },
  { label: "Al menos un carácter especial", test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

const dniReqs: Requirement[] = [
  { label: "Mínimo 7 caracteres", test: (v) => v.length >= 7 },
];

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const MIN_PASSWORD_LENGTH = 8;
  const MIN_DNI_LENGTH = 7;
  const MAX_DNI_LENGTH = 8;

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  const confirmPasswordReqs = useMemo<Requirement[]>(() => [
    {
      label: "Las contraseñas coinciden",
      test: (v) => v.length > 0 && v === formData.password,
    },
  ], [formData.password]);

  const edadReqs: Requirement[] = [
    {
      label: "Debes ser mayor de edad",
      test: (v) => {
        if (!v) return false;
        const birth = new Date(v);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        const hasBirthdayPassed =
          today.getMonth() > birth.getMonth() ||
          (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
        return age > 18 || (age === 18 && hasBirthdayPassed);
      },
    },
  ];

  
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

  const handleDniKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key.length > 1) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleDniPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const cleaned = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!cleaned) return;
    const input = e.currentTarget;
    const start = input.selectionStart ?? formData.dni.length;
    const end = input.selectionEnd ?? formData.dni.length;
    const newValue = formData.dni.slice(0, start) + cleaned + formData.dni.slice(end);
    setFormData({ ...formData, dni: newValue.slice(0, MAX_DNI_LENGTH) });
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

    if (passwordReqs.some((r) => !r.test(formData.password))) {
      const msg = "La contraseña no cumple los requisitos de seguridad.";
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      addNotification(msg, "error");
      return;
    }

    if (formData.dni.length < MIN_DNI_LENGTH) {
      const msg = `El DNI debe tener al menos ${MIN_DNI_LENGTH} caracteres.`;
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      addNotification(msg, "error");
      return;
    }

    if (formData.fechaNacimiento) {
      const [y, m, d] = formData.fechaNacimiento.split('-').map(Number);
      const today = new Date();
      const birthDate = new Date(y, m - 1, d);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        const msg = "Debes ser mayor de edad para registrarte.";
        setToastType("error");
        setToastMessage(msg);
        setShowToast(true);
        addNotification(msg, "error");
        return;
      }
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
    <div className="min-h-screen bg-linear-to-br from-bg-main via-bg-secondary to-bg-surface flex items-center justify-center p-8">
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
                <div>
                  <Input
                    label="DNI"
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    onKeyDown={handleDniKeyDown}
                    onPaste={handleDniPaste}
                    placeholder="12345678"
                    required
                    minLength={MIN_DNI_LENGTH}
                    maxLength={MAX_DNI_LENGTH}
                  />
                  <InformRequirements value={formData.dni} requirements={dniReqs} />
                </div>
                <div>
                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    required
                  />
                  <InformRequirements value={formData.fechaNacimiento} requirements={edadReqs} />
                </div>
              </div>

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  className="pr-16"
                />
                <PrivacyEye show={showPassword} onToggle={() => setShowPassword(prev => !prev)} />
              </div>

              <div className="relative">
                <Input
                  label="Confirmar contraseña"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="pr-16"
                />
                <PrivacyEye show={showConfirmPassword} onToggle={() => setShowConfirmPassword(prev => !prev)} />
              </div>

              <InformRequirements
                value={formData.confirmPassword}
                requirements={confirmPasswordReqs}
              />

              <InformRequirements
                value={formData.password}
                requirements={passwordReqs}
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
            <p>
              <span className="text-gray-500">¿Ya tienes cuenta? </span>
              <Link
                to="/login"
                className="inline text-black hover:underline font-medium cursor-pointer"
              >
               Iniciar sesión
              </Link>
            </p>
          </div>
          </div>
        </Card>
      </div>
      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={handleCloseToast}
        />
      )}
    </div>
  );
}
