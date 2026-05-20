import { useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Button, Input } from '../../../components/ui';
import { PrivacyEye } from '../../../components/PrivacyEye';
import { useAuth } from '../../../hooks/useAuth';
import { authApi, usuariosApi } from '../../../api';
import { Notitoast } from '../../../components/Notitoast';

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

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

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
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aptitud física</p>
                  <p className="text-dark dark:text-gray-100">{user?.aptitudFisica ? 'Aprobada' : 'Pendiente'}</p>
                </div>
               
              </div>
              <div className="pt-4">
                <Button onClick={() => setEditing(true)}>Editar perfil</Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">Cambiar contraseña</h3>
          <div className="space-y-4 max-w-md">
            <div className="relative">
              <Input
                label="Contraseña actual"
                type={showCurrentPassword ? 'text' : 'password'}
                className="pr-16"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
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
              />
              <PrivacyEye show={showNewPassword} onToggle={() => setShowNewPassword(prev => !prev)} />
            </div>
            <div className="relative">
              <Input
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                className="pr-16"
                value={passwordData.confirmNewPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
              />
              <PrivacyEye show={showConfirmPassword} onToggle={() => setShowConfirmPassword(prev => !prev)} />
            </div>
            <Button onClick={handleChangePassword} loading={passwordLoading}>Actualizar contraseña</Button>
          </div>
        </Card>
      </div>
      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </MainLayout>
  );
}