import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Button, Input, Modal, Badge } from '../../../components/ui';
import { PrivacyEye } from '../../../components/PrivacyEye';
import { useAuth } from '../../../hooks/useAuth';
import { authApi, usuariosApi } from '../../../api';
import { Notitoast } from '../../../components/Notitoast';
import { InformRequirements, type Requirement } from '../../../components/InformRequirements';
import { useInputFilter } from '../../../hooks/useInputFilter';
import { INPUT_PRESETS } from '../../../utils/inputPresets';
import { aptosFisicosApi } from '../../../api/aptosFisicos';
import { AptoFisico } from '../../../types';
import { AptoFisicoUploader } from '../../aptosFisicos/components/AptoFisicoUploader';
import { AptoFisicoViewer } from '../../aptosFisicos/components/AptoFisicoViewer';

const MAX_PASSWORD_LENGTH = 32;

const passwordReqs: Requirement[] = [
  { label: 'Mínimo 8 caracteres', test: (v) => v.length >= 8 },
  { label: 'Al menos una mayúscula', test: (v) => /[A-Z]/.test(v) },
  { label: 'Al menos una minúscula', test: (v) => /[a-z]/.test(v) },
  { label: 'Al menos un número', test: (v) => /[0-9]/.test(v) },
  {
    label: 'Al menos un carácter especial',
    test: (v) => /[^a-zA-Z0-9]/.test(v),
  },
];

export function PerfilPage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    telefono: user?.telefono || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const currentPasswordFilter = useInputFilter(
    passwordData.currentPassword,
    (v) => setPasswordData((prev) => ({ ...prev, currentPassword: v })),
    INPUT_PRESETS.password(MAX_PASSWORD_LENGTH)
  );
  const newPasswordFilter = useInputFilter(
    passwordData.newPassword,
    (v) => setPasswordData((prev) => ({ ...prev, newPassword: v })),
    INPUT_PRESETS.password(MAX_PASSWORD_LENGTH)
  );
  const confirmPasswordFilter = useInputFilter(
    passwordData.confirmNewPassword,
    (v) => setPasswordData((prev) => ({ ...prev, confirmNewPassword: v })),
    INPUT_PRESETS.password(MAX_PASSWORD_LENGTH)
  );

  const confirmPasswordReqs = useMemo<Requirement[]>(
    () => [
      {
        label: 'Las contraseñas coinciden',
        test: (v) => v.length > 0 && v === passwordData.newPassword,
      },
    ],
    [passwordData.newPassword]
  );

  const [showPasswordCard, setShowPasswordCard] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  // New states for AptoFisico
  const [aptos, setAptos] = useState<AptoFisico[]>([]);
  const [aptosCargando, setAptosCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [verArchivo, setVerArchivo] = useState(false);

  const aptoActual = aptos.length > 0 ? aptos[0] : null;

  useEffect(() => {
    if (user?.rol === 'Cliente Registrado') {
      aptosFisicosApi.getMisAptos()
        .then(setAptos)
        .catch(() => {})
        .finally(() => setAptosCargando(false));
    } else {
      setAptosCargando(false);
    }
  }, [user]);

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await usuariosApi.update(user.id, formData);
      setEditing(false);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      showToastMessage('Todos los campos son obligatorios.', 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showToastMessage('La nueva contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showToastMessage('La nueva contraseña y la confirmación no coinciden.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmNewPassword,
      });
      showToastMessage(result.message || 'Contraseña actualizada exitosamente.', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      const message = err?.response?.data?.title || err?.response?.data?.error || 'Error al actualizar la contraseña.';
      showToastMessage(message, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <MainLayout title="Mi perfil">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-dark dark:text-gray-100">{user?.nombre} {user?.apellido}</h2>
              <p className="text-gray-500 capitalize">{user?.rol?.replace('_', ' ')}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
                <Input
                  label="Apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} loading={loading}>Guardar</Button>
                <Button variant="ghost" className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-dark dark:text-gray-100">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                  <p className="text-dark dark:text-gray-100">{user?.telefono || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Documento</p>
                  <p className="text-dark dark:text-gray-100">{user?.documento || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de nacimiento</p>
                  <p className="text-dark dark:text-gray-100">{user?.fechaNacimiento || 'No registrada'}</p>
                </div>
                {user?.rol === 'Cliente Registrado' && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aptitud física</p>
                    {aptosCargando ? (
                      <p className="text-dark dark:text-gray-100">Cargando...</p>
                    ) : aptoActual ? (
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {aptoActual.estado === 'Aprobado' && (
                            <>
                              <Badge variant="success">Aprobado</Badge>
                              {aptoActual.fechaEvaluacion && (
                                <span className="text-xs text-gray-500">
                                  {new Date(aptoActual.fechaEvaluacion).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          )}
                          {aptoActual.estado === 'Pendiente' && (
                            <Badge variant="warning">Pendiente de revisión</Badge>
                          )}
                          {aptoActual.estado === 'Rechazado' && (
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
                          Archivo: {aptoActual.nombreArchivo} — {(aptoActual.tamaño / 1024).toFixed(1)} KB
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
                            {aptoActual.estado === 'Pendiente' ? 'Cargar de nuevo' : aptoActual.estado === 'Rechazado' ? 'Reintentar' : 'Actualizar'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <p className="text-dark dark:text-gray-100">Todavía no cargaste un apto físico</p>
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
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100">Cambiar contraseña</h3>
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showPasswordCard ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showPasswordCard && (
          <div className="space-y-4 max-w-md">
            <div className="relative">
              <Input
                label="Contraseña actual"
                type={showCurrentPassword ? 'text' : 'password'}
                className="pr-16"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                onKeyDown={currentPasswordFilter.handleKeyDown}
                onPaste={currentPasswordFilter.handlePaste}
              />
              <PrivacyEye show={showCurrentPassword} onToggle={() => setShowCurrentPassword(prev => !prev)} />
            </div>
            <div className="relative">
              <Input
                label="Nueva contraseña"
                type={showNewPassword ? 'text' : 'password'}
                className="pr-16"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                onKeyDown={newPasswordFilter.handleKeyDown}
                onPaste={newPasswordFilter.handlePaste}
              />
              <PrivacyEye show={showNewPassword} onToggle={() => setShowNewPassword(prev => !prev)} />
            </div>
            <InformRequirements value={passwordData.newPassword} requirements={passwordReqs} />
            <div className="relative">
              <Input
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                className="pr-16"
                value={passwordData.confirmNewPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                onKeyDown={confirmPasswordFilter.handleKeyDown}
                onPaste={confirmPasswordFilter.handlePaste}
              />
              <PrivacyEye show={showConfirmPassword} onToggle={() => setShowConfirmPassword(prev => !prev)} />
            </div>
            <InformRequirements value={passwordData.confirmNewPassword} requirements={confirmPasswordReqs} />
            <Button onClick={handleChangePassword} loading={passwordLoading}>Actualizar contraseña</Button>
          </div>
          )}
        </Card>

        {/* Modal de subida */}
        <Modal isOpen={subiendo} onClose={() => setSubiendo(false)} title="Subir apto físico">
          <AptoFisicoUploader onSuccess={() => {
            setSubiendo(false);
            aptosFisicosApi.getMisAptos().then(setAptos);
          }} />
        </Modal>

        {/* Modal de visualización */}
        <Modal isOpen={verArchivo} onClose={() => setVerArchivo(false)} title="Apto físico" size="lg">
          {aptoActual && (
            <AptoFisicoViewer aptoFisico={aptoActual} onClose={() => setVerArchivo(false)} />
          )}
        </Modal>

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