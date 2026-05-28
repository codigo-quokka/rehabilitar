import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Input } from "../../../components/ui";
import { useAuth } from "../../../hooks/useAuth";
import logo from "../../../assets/logo.png";
import { authApi } from "../../../api";
import { PrivacyEye } from "../../../components/PrivacyEye";
import { InformRequirements, type Requirement } from "../../../components/InformRequirements";
import { Notitoast } from "../../../components/Notitoast";

type PageStatus = "idle" | "loading" | "success" | "error";

const passwordReqs: Requirement[] = [
  { label: "Al menos 8 caracteres", test: (v) => v.length >= 8 },
  { label: "Al menos una minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "Al menos una mayúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "Al menos un número", test: (v) => /[0-9]/.test(v) },
  { label: "Al menos un carácter especial", test: (v) => /[^a-zA-Z0-9]/.test(v) },
];


export function PasswordResetPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");
  const handleCloseToast = useCallback(() => setShowToast(false), []);
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const confirmPasswordReqs = useMemo<Requirement[]>(() => [
    {
      label: "Las contraseñas coinciden",
      test: (v) => v.length > 0 && v === newPassword,
    },
  ], [newPassword]);

  const userId = searchParams.get("userId");
  const passwordResetToken = searchParams.get("passwordResetToken");
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }
    
    if (!userId || !passwordResetToken) {
      setStatus("error");
      setErrorMessage("El enlace de recuperación es inválido o expiró.");
      return;
    }

    // Definimos e invocamos la función asíncrona DENTRO del useEffect
    const verifyToken = async () => {
      try {
        await authApi.validatePasswordResetToken({
          userId,
          passwordResetToken
        });
        // Si tiene éxito, se queda en "idle" y muestra el formulario
        setStatus("idle");
      } catch (error: any) {
        setStatus("error");
        setErrorMessage("El enlace de recuperación es inválido o expiró.");
      }
    };

    verifyToken();
  }, [isAuthenticated, navigate, userId, passwordResetToken]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setToastType("error");
      setToastMessage("Por favor, completa ambos campos de contraseña.");
      setShowToast(true);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setToastType("error");
      setToastMessage("Las contraseñas no coinciden.");
      setShowToast(true);
      return;
    }

    if (passwordReqs.some((r) => !r.test(newPassword))) {
      setToastType("error");
      setToastMessage("La contraseña no cumple los requisitos de seguridad.");
      setShowToast(true);
      return;
    }

    const userId = searchParams.get("userId");
    const passwordResetToken = searchParams.get("passwordResetToken");

    if (!userId || !passwordResetToken) return;

    setStatus("loading");
    setErrorMessage("");
    try {
      await authApi.resetPassword({
        userId,
        passwordResetToken,
        newPassword
      });
      setStatus("success");
    } catch (error: any) {
      const responseData = error.response?.data;

      if (responseData?.fieldErrors?.["Password.SameAsOld"]) {
        setStatus("idle");
        setToastType("error");
        setToastMessage("La nueva contraseña no puede ser idéntica a la actual.");
        setShowToast(true);
      } else if (responseData?.error) {
        setStatus("error");
        setErrorMessage(responseData.error);
      } else if (responseData?.detail) {
        setStatus("error");
        setErrorMessage(responseData.detail);
      } else {
        setStatus("error");
        setErrorMessage("El enlace expiró o es incorrecto.");
      }
    }
  };

  const renderContent = () => {
    switch (status) {
      case "idle":
        return (
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">Cambiar contraseña</h3>
            {errorMessage && (
              <div className="mb-4 text-red-500 text-sm bg-red-50 p-2 rounded text-left">{errorMessage}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md text-left">
              <div className="relative">
                <Input
                  label="Nueva contraseña"
                  type={showNewPassword ? 'text' : 'password'}
                  className="pr-16"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  // minLength={8}
                />
                <PrivacyEye show={showNewPassword} onToggle={() => setShowNewPassword(prev => !prev)} />
              </div>

              <InformRequirements
                value={newPassword}
                requirements={passwordReqs}
              />

              <div className="relative">
                <Input
                  label="Confirmar nueva contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="pr-16"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  // minLength={8}
                />
                <PrivacyEye show={showConfirmPassword} onToggle={() => setShowConfirmPassword(prev => !prev)} />
              </div>

              <InformRequirements
                value={confirmPassword}
                requirements={confirmPasswordReqs}
              />

              

              <Button type="submit" className="w-full">Restablecer contraseña</Button>
            </form>
          </Card>
        );
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            {/* <p className="text-gray-600 dark:text-gray-400">Restableciendo contraseña...</p> */}
          </div>
        );
      case "success":
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-green-500 bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <p className="text-green-600 font-medium">¡Tu contraseña ha sido restablecida con éxito!</p>
            <p className="text-gray-500 text-sm">Ya podés iniciar sesión con tu nueva contraseña.</p>
            <Link to="/login" className="w-full mt-4">
              <Button className="w-full">
                Ir al inicio de sesión
              </Button>
            </Link>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-red-500 bg-red-100 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            <p className="text-red-600 font-medium">{errorMessage}</p>
            <Button 
              onClick={() => navigate("/login")}
              variant="outline"
              className="w-full mt-4"
            >
              Volver al inicio de sesión
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-bg-main via-bg-secondary to-bg-surface dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img
            src={logo}
            alt="RehabilitAR"
            className="w-24 h-auto mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-dark dark:text-gray-100">RehabilitAR</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Centro de Rehabilitación</p>
        </div>

        <Card className="shadow-xl text-center">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-dark dark:text-gray-100 mb-6">
              Recuperación de cuenta
            </h2>

            {renderContent()}
            
          </div>
        </Card>

        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
          © 2026 RehabilitAR
        </p>
      </div>
      {showToast && (
        <Notitoast type={toastType} message={toastMessage} onClose={handleCloseToast} />
      )}
    </div>
  );
}
