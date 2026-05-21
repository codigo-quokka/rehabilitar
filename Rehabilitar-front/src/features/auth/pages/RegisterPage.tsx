import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Card } from "../../../components/ui";
import { PrivacyEye } from "../../../components/PrivacyEye";
import { Notitoast } from "../../../components/Notitoast";
import {
  InformRequirements,
  type Requirement,
} from "../../../components/InformRequirements";
import { authApi } from "../../../api";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications"; // Import useNotifications
import logo from "../../../assets/logo.png";
import axios from "axios";
import { DniScanner } from "../components/DniScanner";

const passwordReqs: Requirement[] = [
  { label: "Mínimo 8 caracteres", test: (v) => v.length >= 8 },
  { label: "Al menos una mayúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "Al menos una minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "Al menos un número", test: (v) => /[0-9]/.test(v) },
  {
    label: "Al menos un carácter especial",
    test: (v) => /[^a-zA-Z0-9]/.test(v),
  },
];

const dniReqs: Requirement[] = [
  { label: "Mínimo 7 caracteres", test: (v) => v.length >= 7 },
];

export function RegisterPage() {
  // const [phase, setPhase] = useState<'scan' | 'form'>('form');
  const [phase, setPhase] = useState<'scan' | 'form' | 'success'>('form');
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
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();
  const MIN_PASSWORD_LENGTH = 8;
  const MIN_DNI_LENGTH = 7;
  const MAX_DNI_LENGTH = 8;

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const confirmPasswordReqs = useMemo<Requirement[]>(
    () => [
      {
        label: "Las contraseñas coinciden",
        test: (v) => v.length > 0 && v === formData.password,
      },
    ],
    [formData.password],
  );

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
          (today.getMonth() === birth.getMonth() &&
            today.getDate() >= birth.getDate());
        return age > 18 || (age === 18 && hasBirthdayPassed);
      },
    },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }
    return undefined;
  }, [isAuthenticated, navigate]); // Removed registrationSuccess

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
    const cleaned = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!cleaned) return;
    const input = e.currentTarget;
    const start = input.selectionStart ?? formData.dni.length;
    const end = input.selectionEnd ?? formData.dni.length;
    const newValue =
      formData.dni.slice(0, start) + cleaned + formData.dni.slice(end);
    setFormData({ ...formData, dni: newValue.slice(0, MAX_DNI_LENGTH) });
  };

interface ScannedDniData {
  firstName?: string;
  lastName?: string;
  dniNumber?: string;
  fechaNacimiento?: string;
}

  const handleScanComplete = (data: ScannedDniData) => {
    setFormData(prev => ({
      ...prev,
      firstName: data.firstName || prev.firstName,
      lastName: data.lastName || prev.lastName,
      dni: data.dniNumber || prev.dni,
      fechaNacimiento: data.fechaNacimiento || prev.fechaNacimiento
    }));

    setToastType("success");
    setToastMessage("Datos leídos correctamente.");
    setShowToast(true);
    setPhase('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowToast(false);

    if (formData.password !== formData.confirmPassword) {
      const msg =
        "Las contraseñas no coinciden. Por favor, ingrésalas de nuevo.";
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      return;
    }

    if (formData.password.length < 8) {
      const msg = "La contraseña debe tener al menos 8 caracteres.";
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      const msg = "La contraseña debe contener al menos una mayúscula.";
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      const msg = "La contraseña debe contener al menos una minúscula.";
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      const msg = "La contraseña debe contener al menos un número.";
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      const msg = "La contraseña debe contener al menos un carácter especial.";
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      return;
    }

    if (formData.dni.length < MIN_DNI_LENGTH) {
      const msg = `El DNI debe tener al menos ${MIN_DNI_LENGTH} caracteres.`;
      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      return;
    }

    if (formData.fechaNacimiento) {
      const [y, m, d] = formData.fechaNacimiento.split("-").map(Number);
      const today = new Date();
      const birthDate = new Date(y, m - 1, d);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      if (age < 18) {
        const msg = "Debes ser mayor de edad para registrarte.";
        setToastType("error");
        setToastMessage(msg);
        setShowToast(true);
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
      setPhase('success');
    } catch (err: unknown) {
      let msg = "Error al registrar usuario. Intenta de nuevo.";

      if (axios.isAxiosError(err)) {
        const apiMsg = err.response?.data?.error;
        if (apiMsg && apiMsg.includes("is already taken")) {
          msg = "El correo ingresado ya se encuentra en uso";
        } else {
          msg = apiMsg ?? msg;
        }
      }

      setToastType("error");
      setToastMessage(msg);
      setShowToast(true);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-bg-main via-bg-secondary to-bg-surface dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <img
              src={logo}
              alt="RehabilitAR"
              className="w-24 h-auto mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold text-dark dark:text-gray-100">
              RehabilitAR
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              Centro de Rehabilitación
            </p>
          </div>

          <Card className="shadow-xl">
            <div className="p-2">
              <h2 className="text-2xl font-semibold text-dark dark:text-gray-100 mb-8">
                Crear cuenta
              </h2>

              {phase === 'scan' ? (
                <DniScanner 
                  onScanComplete={handleScanComplete} 
                  onManualEntry={() => setPhase('form')} 
                />
              ) : phase === 'success' ? (
                <div className="text-center space-y-6 animate-in fade-in duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-20 h-20 text-green-500 mx-auto"
                    aria-hidden="true" // Added aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h2 className="text-2xl font-semibold text-dark dark:text-gray-100">
                    ¡Registro exitoso!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Hemos enviado un correo electrónico a la dirección proporcionada. Por favor, verificá tu bandeja de entrada (y la carpeta de spam) para activar tu cuenta y poder iniciar sesión.
                  </p>
                  <Link to="/login">
                    <Button className="w-full py-3 text-base">
                      Ir al inicio de sesión
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
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
                    label="Teléfono (opcional)"
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    onKeyDown={handleDniKeyDown} // funca igual es para números :P
                    placeholder="+54 221 123 4567"
                    minLength={12} // que sea un teléfono válido o nada.
                    // se podría mejorar haciendo el temita de separar código de país y area.
                    maxLength={12}
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
                      <InformRequirements
                        value={formData.dni}
                        requirements={dniReqs}
                      />
                    </div>
                    <div>
                      <Input
                        label="Fecha de nacimiento"
                        type="date"
                        name="fechaNacimiento"
                        value={formData.fechaNacimiento}
                        onChange={handleChange}
                        min="1900-01-01"
                        max={todayStr}
                        required
                      />
                      <InformRequirements
                        value={formData.fechaNacimiento}
                        requirements={edadReqs}
                      />
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
                    <PrivacyEye
                      show={showPassword}
                      onToggle={() => setShowPassword((prev) => !prev)}
                    />
                  </div>
                  <InformRequirements
                    value={formData.password}
                    requirements={passwordReqs}
                  />

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
                    <PrivacyEye
                      show={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword((prev) => !prev)}
                    />
                  </div>

                  <InformRequirements
                    value={formData.confirmPassword}
                    requirements={confirmPasswordReqs}
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
              )}

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
      </div>
      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={handleCloseToast}
        />
      )}
    </>
  );
}
