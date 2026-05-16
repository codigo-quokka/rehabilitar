import { useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Button, Input } from '../../../components/ui';
import { PrivacyEye } from '../../../components/PrivacyEye';
import { useAuth } from '../../../hooks/useAuth';
import { usuariosApi } from '../../../api';

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
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
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
              />
              <PrivacyEye show={showCurrentPassword} onToggle={() => setShowCurrentPassword(prev => !prev)} />
            </div>
            <div className="relative">
              <Input
                label="Nueva contraseña"
                type={showNewPassword ? 'text' : 'password'}
                className="pr-16"
              />
              <PrivacyEye show={showNewPassword} onToggle={() => setShowNewPassword(prev => !prev)} />
            </div>
            <div className="relative">
              <Input
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                className="pr-16"
              />
              <PrivacyEye show={showConfirmPassword} onToggle={() => setShowConfirmPassword(prev => !prev)} />
            </div>
            <Button>Actualizar contraseña</Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}