import { useState, useEffect, useMemo, useRef } from "react";
import { MainLayout } from "../../../components/layout";
import { Card, Button, Input, Modal, Badge } from "../../../components/ui";
import { PrivacyEye } from "../../../components/PrivacyEye";
import { useAuth } from "../../../hooks/useAuth";
import { authApi, usuariosApi } from "../../../api";
import { Notitoast } from "../../../components/Notitoast";

import { ConfirmActionModal } from "../../../components/ConfirmActionModal";

import { ConfirmActionModalVerde } from "../../../components/ConfirmActionModalVerde";
import {
  InformRequirements,
  type Requirement,
} from "../../../components/InformRequirements";
import { useInputFilter } from "../../../hooks/useInputFilter";
import { INPUT_PRESETS } from "../../../utils/inputPresets";

import { aptosFisicosApi } from "../../../api/aptosFisicos";
import { AptoFisico, ChangePasswordData } from "../../../types";
import { AptoFisicoUploader } from "../../aptosFisicos/components/AptoFisicoUploader";
import { AptoFisicoViewer } from "../../aptosFisicos/components/AptoFisicoViewer";

const MAX_PASSWORD_LENGTH = 32;

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

export function PerfilPage() {
  const { user, updateUser } = useAuth();
  const stripNonLetters = (value: string) =>
    value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
  const stripNonDigits = (value: string) => value.replace(/\D/g, "");

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    telefono: user?.telefono || "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const currentPasswordFilter = useInputFilter(
    passwordData.currentPassword,
    (v) => setPasswordData((prev) => ({ ...prev, currentPassword: v })),
    INPUT_PRESETS.password(MAX_PASSWORD_LENGTH),
  );
  const newPasswordFilter = useInputFilter(
    passwordData.newPassword,
    (v) => setPasswordData((prev) => ({ ...prev, newPassword: v })),
    INPUT_PRESETS.password(MAX_PASSWORD_LENGTH),
  );
  const confirmPasswordFilter = useInputFilter(
    passwordData.confirmNewPassword,
    (v) => setPasswordData((prev) => ({ ...prev, confirmNewPassword: v })),
    INPUT_PRESETS.password(MAX_PASSWORD_LENGTH),
  );
  const nombreFilter = useInputFilter(
    formData.nombre,
    (v) => setFormData((prev) => ({ ...prev, nombre: v })),
    INPUT_PRESETS.name,
  );
  const apellidoFilter = useInputFilter(
    formData.apellido,
    (v) => setFormData((prev) => ({ ...prev, apellido: v })),
    INPUT_PRESETS.name,
  );

  const confirmPasswordReqs = useMemo<Requirement[]>(
    () => [
      {
        label: "Las contraseñas coinciden",
        test: (v) => v.length > 0 && v === passwordData.newPassword,
      },
    ],
    [passwordData.newPassword],
  );

  const [showPasswordCard, setShowPasswordCard] = useState(false);
  const [showConfirmPasswordModal, setShowConfirmPasswordModal] =
    useState(false);
  const changePasswordDataRef = useRef<ChangePasswordData | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");

  // New states for AptoFisico
  const [aptos, setAptos] = useState<AptoFisico[]>([]);
  const [aptosCargando, setAptosCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [verArchivo, setVerArchivo] = useState(false);

  const aptoActual = aptos.length > 0 ? aptos[0] : null;

  const MIN_PASSWORD_LENGTH = 8;

  useEffect(() => {
    if (user?.rol === "Cliente Registrado") {
      aptosFisicosApi
        .getMisAptos()
        .then(setAptos)
        .catch(() => {})
        .finally(() => setAptosCargando(false));
    } else {
      setAptosCargando(false);
    }
  }, [user]);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleConfirmSave = async () => {
    if (!user) return;

    const trimmedNombre = formData.nombre.trim();
    const trimmedApellido = formData.apellido.trim();

    setShowSaveConfirm(false);
    setLoading(true);
    try {
      await usuariosApi.update(user.id, {
        ...formData,
        nombre: trimmedNombre,
        apellido: trimmedApellido,
      });
      updateUser({
        ...user,
        ...formData,
        nombre: trimmedNombre,
        apellido: trimmedApellido,
      });
      showToastMessage("Perfil actualizado exitosamente.", "success");
      setEditing(false);
    } catch (err) {
      const msg =
        (err as any)?.response?.data?.error || "Error al actualizar el perfil.";
      showToastMessage(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!user) return;

    const trimmedNombre = formData.nombre.trim();
    const trimmedApellido = formData.apellido.trim();

    if (!trimmedNombre || !trimmedApellido) {
      showToastMessage("El nombre y apellido no pueden estar vacíos.", "error");
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleCancelEditing = () => {
    setFormData({
      nombre: user?.nombre || "",
      apellido: user?.apellido || "",
      telefono: user?.telefono || "",
      email: user?.email || "",
    });
    setShowCancelConfirm(false);
    setEditing(false);
  };

  const handleChangePassword = async () => {
    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmNewPassword
    ) {
      showToastMessage("Todos los campos son obligatorios.", "error");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showToastMessage(
        "La nueva contraseña y la confirmación no coinciden.",
        "error",
      );
      return;
    }

    if (passwordReqs.some((r) => !r.test(passwordData.newPassword))) {
      setToastType("error");
      setToastMessage("La contraseña no cumple los requisitos de seguridad.");
      setShowToast(true);
      return;
    }
    /*
    if (passwordData.newPassword.length < MIN_PASSWORD_LENGTH) {
      setToastType("error");
      setToastMessage(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      setShowToast(true);
      return;
    }
    if (!/[A-Z]/.test(passwordData.newPassword)) {
      setToastType("error");
      setToastMessage("La contraseña debe contener al menos una mayúscula.");
      setShowToast(true);
      return;
    }
    if (!/[a-z]/.test(passwordData.newPassword)) {
      setToastType("error");
      setToastMessage("La contraseña debe contener al menos una minúscula.");
      setShowToast(true);
      return;
    }
    if (!/[0-9]/.test(passwordData.newPassword)) {
      setToastType("error");
      setToastMessage("La contraseña debe contener al menos un número.");
      setShowToast(true);
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(passwordData.newPassword)) {
      setToastType("error");
      setToastMessage("La contraseña debe contener al menos un carácter especial.");
      setShowToast(true);
      return;
    }
    */
    changePasswordDataRef.current = {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmNewPassword: passwordData.confirmNewPassword,
    };
    setShowConfirmPasswordModal(true);
  };

  const confirmChangePassword = async () => {
    if (!changePasswordDataRef.current) return;

    setShowConfirmPasswordModal(false);
    setPasswordLoading(true);

    try {
      const result = await authApi.changePassword(
        changePasswordDataRef.current,
      );
      showToastMessage(
        result.message || "Contraseña actualizada correctamente.",
        "success",
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err: any) {
      const rawError = err?.response?.data?.error || "";
      const message =
        rawError.includes("Incorrect password.")
          ? "La contraseña actual es incorrecta."
          : err?.response?.data?.title ||
            rawError ||
            "Error al actualizar la contraseña.";
      showToastMessage(message, "error");
    } finally {
      setPasswordLoading(false);
      changePasswordDataRef.current = null;
    }
  };

  return (
    <MainLayout title="Mi perfil">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {user?.nombre?.charAt(0)}
                {user?.apellido?.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-dark dark:text-gray-100">
                {user?.nombre} {user?.apellido}
              </h2>
              <p className="text-gray-500 capitalize">
                {user?.rol?.replace("_", " ")}
              </p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  onKeyDown={nombreFilter.handleKeyDown}
                  onPaste={nombreFilter.handlePaste}
                />
                <Input
                  label="Apellido"
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      apellido: e.target.value,
                    }))
                  }
                  onKeyDown={apellidoFilter.handleKeyDown}
                  onPaste={apellidoFilter.handlePaste}
                />
              </div>
              <Input
                label="Teléfono"
                type="tel"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    telefono: stripNonDigits(e.target.value),
                  })
                }
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (stripNonDigits(pasted) !== pasted) e.preventDefault();
                }}
              />
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} loading={loading}>
                  Guardar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-dark dark:text-gray-100">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Teléfono
                  </p>
                  <p className="text-dark dark:text-gray-100">
                    {user?.telefono || "No registrado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Documento
                  </p>
                  <p className="text-dark dark:text-gray-100">
                    {user?.documento || "No registrado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Fecha de nacimiento
                  </p>
                  <p className="text-dark dark:text-gray-100">
                    {user?.fechaNacimiento || "No registrada"}
                  </p>
                </div>
                {user?.rol === "Cliente Registrado" && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aptitud física
                    </p>
                    {aptosCargando ? (
                      <p className="text-dark dark:text-gray-100">
                        Cargando...
                      </p>
                    ) : aptoActual ? (
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {aptoActual.estado === "Aprobado" && (
                            <>
                              <Badge variant="success">Aprobado</Badge>
                              {aptoActual.fechaEvaluacion && (
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    aptoActual.fechaEvaluacion,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          )}
                          {aptoActual.estado === "Pendiente" && (
                            <Badge variant="warning">
                              Pendiente de revisión
                            </Badge>
                          )}
                          {aptoActual.estado === "Rechazado" && (
                            <div className="space-y-1">
                              <Badge variant="danger">Rechazado</Badge>
                              {aptoActual.motivoRechazo && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                  Motivo: {aptoActual.motivoRechazo}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Archivo: {aptoActual.nombreArchivo} —{" "}
                          {(aptoActual.tamaño / 1024).toFixed(1)} KB
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVerArchivo(true)}
                          >
                            Ver archivo
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSubiendo(true)}
                          >
                            {aptoActual.estado === "Pendiente"
                              ? "Cargar de nuevo"
                              : aptoActual.estado === "Rechazado"
                                ? "Reintentar"
                                : "Actualizar"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <p className="text-dark dark:text-gray-100">
                          Todavía no cargaste un apto físico
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          className="mt-2"
                          onClick={() => setSubiendo(true)}
                        >
                          Subir apto físico
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-4">
                <Button onClick={() => setEditing(true)}>Editar perfil</Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="mt-6">
          <button
            type="button"
            onClick={() => setShowPasswordCard((prev) => !prev)}
            className="w-full flex items-center justify-between text-left mb-4"
            aria-expanded={showPasswordCard}
            aria-controls="password-card-content"
          >
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100">
              Cambiar contraseña
            </h3>
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showPasswordCard ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showPasswordCard && (
            <div className="space-y-4 max-w-md">
              <div className="relative">
                <Input
                  label="Contraseña actual"
                  type={showCurrentPassword ? "text" : "password"}
                  className="pr-16"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  onKeyDown={currentPasswordFilter.handleKeyDown}
                  onPaste={currentPasswordFilter.handlePaste}
                />
                <PrivacyEye
                  show={showCurrentPassword}
                  onToggle={() => setShowCurrentPassword((prev) => !prev)}
                />
              </div>
              <div className="relative">
                <Input
                  label="Nueva contraseña"
                  type={showNewPassword ? "text" : "password"}
                  className="pr-16"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  onKeyDown={newPasswordFilter.handleKeyDown}
                  onPaste={newPasswordFilter.handlePaste}
                />
                <PrivacyEye
                  show={showNewPassword}
                  onToggle={() => setShowNewPassword((prev) => !prev)}
                />
              </div>
              <InformRequirements
                value={passwordData.newPassword}
                requirements={passwordReqs}
              />
              <div className="relative">
                <Input
                  label="Confirmar contraseña"
                  type={showConfirmPassword ? "text" : "password"}
                  className="pr-16"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmNewPassword: e.target.value,
                    })
                  }
                  onKeyDown={confirmPasswordFilter.handleKeyDown}
                  onPaste={confirmPasswordFilter.handlePaste}
                />
                <PrivacyEye
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                />
              </div>
              <InformRequirements
                value={passwordData.confirmNewPassword}
                requirements={confirmPasswordReqs}
              />
              <Button onClick={handleChangePassword} loading={passwordLoading}>
                Actualizar contraseña
              </Button>
            </div>
          )}
        </Card>

        <ConfirmActionModalVerde
          title="Cambiar contraseña"
          body="¿Estás seguro de que deseas cambiar tu contraseña?"
          confirmLabel="Confirmar"
          onConfirm={confirmChangePassword}
          onCancel={() => {
            setShowConfirmPasswordModal(false);
            changePasswordDataRef.current = null;
          }}
          isOpen={showConfirmPasswordModal}
        />

        {/* Modal de subida */}
        <Modal
          isOpen={subiendo}
          onClose={() => setSubiendo(false)}
          title="Subir apto físico"
        >
          <AptoFisicoUploader
            onSuccess={() => {
              setSubiendo(false);
              aptosFisicosApi.getMisAptos().then(setAptos);
            }}
          />
        </Modal>

        {/* Modal de visualización */}
        <Modal
          isOpen={verArchivo}
          onClose={() => setVerArchivo(false)}
          title="Apto físico"
          size="lg"
        >
          {aptoActual && <AptoFisicoViewer aptoFisico={aptoActual} />}
        </Modal>

        <ConfirmActionModal
          isOpen={showCancelConfirm}
          title="Descartar cambios"
          body="¿Estás seguro de descartar los cambios realizados?"
          confirmLabel="Descartar"
          onConfirm={handleCancelEditing}
          onCancel={() => setShowCancelConfirm(false)}
        />

        <ConfirmActionModalVerde
          isOpen={showSaveConfirm}
          title="Guardar cambios"
          body="¿Estás seguro de guardar los cambios realizados?"
          confirmLabel="Guardar"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowSaveConfirm(false)}
        />

        {showToast && (
          <Notitoast
            type={toastType}
            message={toastMessage}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </MainLayout>
  );
}
