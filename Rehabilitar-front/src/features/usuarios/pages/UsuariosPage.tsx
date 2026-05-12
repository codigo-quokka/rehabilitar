import { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Button, Badge, Modal, Input, Select, Table } from '../../../components/ui';
import { usuariosApi } from '../../../api';
import { User, Role } from '../../../types';

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await usuariosApi.getAll();
      setUsuarios(data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await usuariosApi.delete(id);
      fetchData();
    } catch (err) {
    }
  };

  const handleSuspender = async (id: string) => {
    if (!confirm('¿Estás seguro de suspender este usuario?')) return;
    try {
      await usuariosApi.suspender(id);
      fetchData();
    } catch (err) {
    }
  };

  const handleReactivar = async (id: string) => {
    try {
      await usuariosApi.reactivar(id);
      fetchData();
    } catch (err) {
    }
  };

  const columns = [
    { key: 'nombre', header: 'Nombre', render: (u: User) => `${u.nombre} ${u.apellido}` },
    { key: 'email', header: 'Email' },
    {
      key: 'rol',
      header: 'Rol',
      render: (u: User) => (
        <Badge variant={u.rol === 'admin' ? 'danger' : u.rol === 'professor' ? 'info' : 'default'}>
          {u.rol.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (u: User) => (
        <Badge variant={u.activo ? 'success' : 'danger'}>
          {u.activo ? 'Activo' : 'Suspendido'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (u: User) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(u)}>
            Editar
          </Button>
          {u.activo ? (
            <Button variant="outline" size="sm" onClick={() => handleSuspender(u.id)}>
              Suspender
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleReactivar(u.id)}>
              Reactivar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Usuarios">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setShowModal(true)}>Nuevo Usuario</Button>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <Card padding="none">
            <Table columns={columns} data={usuarios} keyExtractor={(u) => u.id} />
          </Card>
        )}
      </div>

      <Modal
        isOpen={showModal || !!selectedUser}
        onClose={() => { setShowModal(false); setSelectedUser(null); }}
        title={selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <UsuarioForm
          user={selectedUser}
          onClose={() => { setShowModal(false); setSelectedUser(null); fetchData(); }}
        />
      </Modal>
    </MainLayout>
  );
}

interface UsuarioFormProps {
  user: User | null;
  onClose: () => void;
}

function UsuarioForm({ user, onClose }: UsuarioFormProps) {
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    rol: user?.rol || 'registered_client',
    especialidad: user?.especialidad || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        await usuariosApi.update(user.id, formData);
      } else {
        await usuariosApi.create(formData);
      }
      onClose();
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const roles: Role[] = ['admin', 'reception', 'professor', 'registered_client', 'guest'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
        <Input
          label="Apellido"
          value={formData.apellido}
          onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
          required
        />
      </div>
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <Select
        label="Rol"
        value={formData.rol}
        onChange={(e) => setFormData({ ...formData, rol: e.target.value as Role, especialidad: e.target.value !== 'professor' ? '' : formData.especialidad })}
        options={roles.map((r) => ({ value: r, label: r.replace('_', ' ') }))}
      />
      {formData.rol === 'professor' && (
        <Select
          label="Especialidad"
          value={formData.especialidad}
          onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
          options={[
            { value: 'TrenSuperior', label: 'Tren Superior' },
            { value: 'TrenMedio', label: 'Tren Medio' },
            { value: 'TrenInferior', label: 'Tren Inferior' },
          ]}
          required
        />
      )}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>{user ? 'Actualizar' : 'Crear'}</Button>
      </div>
    </form>
  );
}
