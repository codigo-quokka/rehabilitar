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
import { useNotifications } from "../../../hooks/useNotifications";
import logo from "../../../assets/logo.png";
import axios from "axios";
import { DniScanner } from "../components/DniScanner";

// Importamos nuestro hook y presets globales
import { useInputFilter } from "../../../hooks/useInputFilter";
import { INPUT_PRESETS } from "../../../utils/inputPresets";

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
  const navigate = useNavigate();
  
  const MIN_PASSWORD_LENGTH = 8;
  const MAX_PASSWORD_LENGTH = 32;
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
    [formData.password]
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
    }
  }, [isAuthenticated, navigate]);

  // Manejador estándar para cambios de texto regulares
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Helper para el onPaste del custom hook
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- INICIALIZACIÓN DE HOOKS DE FILTRADO ---
  const firstNameFilter = useInputFilter(formData.firstName, (v) => updateField("firstName", v), INPUT_PRESETS.name);
  const lastNameFilter = useInputFilter(formData.lastName, (v) => updateField("lastName", v), INPUT_PRESETS.name);
  const emailFilter = useInputFilter(formData.email, (v) => updateField("email", v), INPUT_PRESETS.email);
  const phoneFilter = useInputFilter(formData.telefono, (v) => updateField("telefono", v), INPUT_PRESETS.digits(12));
  const dniFilter = useInputFilter(formData.dni, (v) => updateField("dni", v), INPUT_PRESETS.digits(MAX_DNI_LENGTH));
  const passwordFilter = useInputFilter(formData.password, (v) => updateField("password", v), INPUT_PRESETS.password(MAX_PASSWORD_LENGTH));
  const confirmPasswordFilter = useInputFilter(formData.confirmPassword, (v) => updateField("confirmPassword", v), INPUT_PRESETS.password(MAX_PASSWORD_LENGTH));

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

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.dni || !formData.fechaNacimiento || !formData.password || !formData.confirmPassword) {
      setToastType("error");
      setToastMessage("Por favor, completa todos los campos obligatorios.");
      setShowToast(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToastType("error");
      setToastMessage("Las contraseñas no coinciden. Por favor, ingrésalas de nuevo.");
      setShowToast(true);
      return;
    }

    if (passwordReqs.some((r) => !r.test(formData.password))) {
      setToastType("error");
      setToastMessage("La contraseña no cumple los requisitos de seguridad.");
      setShowToast(true);
      return;
    }
    /*
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setToastType("error");
      setToastMessage(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      setShowToast(true);
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setToastType("error");
      setToastMessage("La contraseña debe contener al menos una mayúscula.");
      setShowToast(true);
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setToastType("error");
      setToastMessage("La contraseña debe contener al menos una minúscula.");
      setShowToast(true);
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setToastType("error");
      setToastMessage("La contraseña debe contener al menos un número.");
      setShowToast(true);
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      setToastType("error");
      setToastMessage("La contraseña debe contener al menos un carácter especial.");
      setShowToast(true);
      return;
    }
    */

    if (formData.dni.length < MIN_DNI_LENGTH) {
      setToastType("error");
      setToastMessage("Ingrese un DNI válido");
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
        setToastType("error");
        setToastMessage("Debes ser mayor de edad para registrarte.");
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
          <div className="w-full max-w-5xl">
          <div className="text-center mb-10">
            <img src={logo} alt="RehabilitAR" className="w-24 h-auto mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-dark dark:text-gray-100">RehabilitAR</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Centro de Rehabilitación</p>
          </div>

          <Card className="shadow-">
            <div className="p-2">
              <h2 className="text-2xl font-semibold text-dark dark:text-gray-100 mb-8">
                Registro de usuario
              </h2>

              {phase === 'scan' ? (
                <DniScanner onScanComplete={handleScanComplete} onManualEntry={() => setPhase('form')} />
              ) : phase === 'success' ? (
                <div className="text-center space-y-6 animate-in fade-in duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-20 h-20 text-green-500 mx-auto"
                    aria-hidden="true"
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
                  <p className="text-gray-600 dark:text-gray-400 text-justify">
                    Hemos enviado un correo electrónico a la dirección proporcionada. Por favor, verificá tu bandeja de entrada (y la carpeta de spam) para activar tu cuenta y poder iniciar sesión.
                  </p>
                  <Link to="/login">
                    <Button className="w-full py-3 text-base">Ir al inicio de sesión</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Nombre"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          onKeyDown={firstNameFilter.handleKeyDown}
                          onPaste={firstNameFilter.handlePaste}
                          placeholder="Juan"
                        />
                        <Input
                          label="Apellido"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          onKeyDown={lastNameFilter.handleKeyDown}
                          onPaste={lastNameFilter.handlePaste}
                          placeholder="Pérez"
                        />
                      </div>

                      <Input
                        label="Email"
                        type="" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onKeyDown={emailFilter.handleKeyDown}
                        onPaste={emailFilter.handlePaste}
                        placeholder="tu@email.com"
                      />

                      <Input
                        label="Teléfono (opcional)"
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        onKeyDown={phoneFilter.handleKeyDown}
                        onPaste={phoneFilter.handlePaste}
                        placeholder="+54 221 123 4567"
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
                            onKeyDown={dniFilter.handleKeyDown}
                            onPaste={dniFilter.handlePaste}
                            placeholder="12345678"
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
                            min="1900-01-01"
                            max={todayStr}
                          />
                          <InformRequirements value={formData.fechaNacimiento} requirements={edadReqs} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="relative">
                        <Input
                          label="Contraseña"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onKeyDown={passwordFilter.handleKeyDown}
                          onPaste={passwordFilter.handlePaste}
                          placeholder="••••••••"
                          minLength={MIN_PASSWORD_LENGTH}
                          maxLength={MAX_PASSWORD_LENGTH}
                          className="pr-16"
                        />
                        <PrivacyEye show={showPassword} onToggle={() => setShowPassword((prev) => !prev)} />
                      </div>
                      <InformRequirements value={formData.password} requirements={passwordReqs} />

                      <div className="relative">
                        <Input
                          label="Confirmar contraseña"
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onKeyDown={confirmPasswordFilter.handleKeyDown}
                          onPaste={confirmPasswordFilter.handlePaste}
                          placeholder="••••••••"
                          minLength={MIN_PASSWORD_LENGTH}
                          maxLength={MAX_PASSWORD_LENGTH}
                          className="pr-16"
                        />
                        <PrivacyEye show={showConfirmPassword} onToggle={() => setShowConfirmPassword((prev) => !prev)} />
                      </div>
                      <InformRequirements value={formData.confirmPassword} requirements={confirmPasswordReqs} />

                      <Button type="submit" className="w-full py-3 text-base" loading={loading} disabled={loading}>
                        Crear cuenta
                      </Button>

                      <div className="pt-6 border-t border-border text-center">
                        <p>
                          <span className="text-gray-600 dark:text-gray-400">¿Ya tienes cuenta? </span>
                          <span onClick={() => (window.location.href = '/login')}  className="inline text-dark-green dark:text-primary hover:underline font-medium cursor-pointer">
                            Iniciar sesión
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
      {showToast && (
        <Notitoast type={toastType} message={toastMessage} onClose={handleCloseToast} />
      )}
    </>
  );
}