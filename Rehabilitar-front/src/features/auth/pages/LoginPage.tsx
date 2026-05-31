import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Card } from "../../../components/ui";
import { PrivacyEye } from "../../../components/PrivacyEye";
import { useAuth } from "../../../hooks/useAuth";
import logo from "../../../assets/logo.png";
import { authApi } from "../../../api";
import { Notitoast } from "../../../components/Notitoast";
import { useInputFilter } from "../../../hooks/useInputFilter";
import { INPUT_PRESETS } from "../../../utils/inputPresets";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated]);

  const emailFilter = useInputFilter(email, setEmail, INPUT_PRESETS.email);
  const passwordFilter = useInputFilter(password, setPassword, INPUT_PRESETS.password());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendSuccess(false);
    setUnverifiedEmail("");
    setShowToast(false);

    if (!email || !password) {
      setToastType("error");
      setToastMessage("Por favor, completa todos los campos.");
      setShowToast(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      if (err.response?.data?.errorCode === "Email.NotVerified") {
        setUnverifiedEmail(email);
        setToastType("error");
        setToastMessage(
            "Debes confirmar tu correo para iniciar sesión. \nVerifica tu bandeja de entada y tu bandeja de spam.",
        );
        setShowToast(true);
      } else if (err.response?.data?.error === "Usuario suspendido.") {
        setToastType("error");
        setToastMessage("Cuenta suspendida, deberás reactivarla presencialmente.");
        setShowToast(true);
      } else {
        setToastType("error");
        setToastMessage("Email o contraseña incorrectos.");
        setShowToast(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    setResendSuccess(false);
    setShowToast(false);
    try {
      await authApi.resendVerificationEmail(unverifiedEmail);
      setResendSuccess(true);
    } catch (err: any) {
      setToastType("error");
      setToastMessage(
        err.response?.data?.error || "Ocurrió un error al reenviar el correo de verificación.",
      );
      setShowToast(true);
    } finally {
      setResending(false);
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

        <Card className="shadow-xl">
          <div className="p-2">
            <h2 className="text-2xl font-semibold text-dark dark:text-gray-100 mb-8">
              Bienvenido
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {unverifiedEmail && !resendSuccess && (
                <div className="p-4 bg-bg-surface dark:bg-gray-800/50 rounded-xl border border-border dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                    Tu correo electrónico aún no ha sido verificado.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendEmail}
                    loading={resending}
                    className="w-full"
                  >
                    Reenviar correo de confirmación
                  </Button>
                </div>
              )}

              {resendSuccess && (
                <div className="p-4 bg-bg-surface dark:bg-gray-800/50 rounded-xl border border-border dark:border-gray-700">
                  <p className="text-sm text-primary font-medium text-center">
                    Correo de confirmación reenviado exitosamente.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    Revisa tu bandeja de entrada y tu bandeja de spam.
                  </p>
                </div>
              )}

              <Input
                label="Email"
                type=""
                value={email}
                onChange={(e) => setEmail(e.target.value.replace(INPUT_PRESETS.email.cleanPasteRegex, ''))}
                onKeyDown={emailFilter.handleKeyDown}
                onPaste={emailFilter.handlePaste}
                placeholder="tu@email.com"
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(INPUT_PRESETS.password().cleanPasteRegex, ''))}
                  onKeyDown={passwordFilter.handleKeyDown}
                  onPaste={passwordFilter.handlePaste}
                  placeholder="••••••••"
                  className="pr-16"
                />
                <PrivacyEye
                  show={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                />
              </div>

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

            <div className="mt-8 pt-6 border-t border-border dark:border-gray-700 text-center">
              <p>
                <span className="text-gray-500">¿No tienes cuenta? </span>
                <Link
                  to="/register"
                  className="inline text-black hover:underline font-medium cursor-pointer"
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
      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
