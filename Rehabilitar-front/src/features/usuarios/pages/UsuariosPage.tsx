import { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Button, Badge, Modal, Input, Select, Table, FilterDropdown } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { usuariosApi } from '../../../api';
import { User, Role } from '../../../types';
import { Notitoast } from '../../../components/Notitoast';
import { ConfirmActionModal } from '../../../components/ConfirmActionModal';



export function UsuariosPage() {
  const { user: currentUser, hasRole } = useAuth();
  const isReception = hasRole(['Recepción']);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
  const [userToReactivar, setUserToReactivar] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    rol: 'all',
    estado: 'all',
  });

  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const roles: Role[] = ['Administrador', 'Recepción', 'Profesor', 'Cliente Registrado'];

  const tipoLabel: Record<string, string> = {
    TrenSuperior: 'Tren Superior',
    TrenMedio: 'Tren Medio',
    TrenInferior: 'Tren Inferior',
  };

  const rolLabel: Record<string, string> = {
    Administrador: 'Admin',
    Recepción: 'Recepción',
    Profesor: 'Profesor',
    'Cliente Registrado': 'Cliente',

  };

  const filteredUsuarios = usuarios.filter(u => {
    if (isReception && u.rol !== 'Cliente Registrado') return false;
    if (filters.rol !== 'all' && u.rol !== filters.rol) return false;
    if (filters.estado === 'active' && !u.activo) return false;
    if (filters.estado === 'suspended' && u.activo) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
      if (!fullName.includes(term) && !u.email.toLowerCase().includes(term)) return false;
    }
    return true;
  }).filter(u => u.id !== currentUser?.id);

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

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await usuariosApi.delete(userToDelete.id);
      setUserToDelete(null);
      fetchData();
      setToastType('success');
      setToastMessage('Usuario eliminado con éxito');
      setShowToast(true);
    } catch (err) {
      setUserToDelete(null);
      const msg = (err as any)?.response?.data?.error || 'Error al eliminar usuario';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    }
  };

  const handleConfirmSuspender = async () => {
    if (!userToSuspend) return;
    try {
      const response = await usuariosApi.suspender(userToSuspend.id);
      setUserToSuspend(null);
      fetchData();
      setToastType('success');
      setToastMessage(response?.message || 'Cuenta suspendida con éxito');
      setShowToast(true);
    } catch (err) {
      setUserToSuspend(null);
      const msg = (err as any)?.response?.data?.error || 'Error al suspender la cuenta';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    }
  };

  const handleReactivar = (user: User) => {
    setUserToReactivar(user);
  };

  const handleConfirmReactivar = async () => {
    if (!userToReactivar) return;
    try {
      await usuariosApi.reactivar(userToReactivar.id);
      setUserToReactivar(null);
      fetchData();
      setToastType('success');
      setToastMessage('Cuenta reactivada con éxito');
      setShowToast(true);
    } catch (err) {
      setUserToReactivar(null);
      const msg = (err as any)?.response?.data?.error || 'Error al reactivar la cuenta';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    }
  };

  const columns = [
    { key: 'nombre', header: 'Nombre', render: (u: User) => `${u.nombre} ${u.apellido}` },
    { key: 'email', header: 'Email' },
    {
      key: 'rol',
      header: 'Rol',
      render: (u: User) => (
        <div className="flex items-center gap-2">
          <Badge variant={u.rol === 'Administrador' ? 'danger' : u.rol === 'Profesor' ? 'info' : u.rol === 'Recepción' ? 'amber' : 'default'}>
            {rolLabel[u.rol] || u.rol.replace('_', ' ')}
          </Badge>
          {u.rol === 'Profesor' && u.especialidad && (
            <Badge variant="success">{tipoLabel[u.especialidad] || u.especialidad}</Badge>
          )}
        </div>
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
          <Button variant="verde" onClick={() => setSelectedUser(u)}>
            Editar
          </Button>
          {u.activo ? (
            <Button variant="naranja" size="sm" onClick={() => setUserToSuspend(u)}>
              Suspender
            </Button>
          ) : (
            <Button variant="naranja" size="sm" onClick={() => handleReactivar(u)}>
              Reactivar
            </Button>
          )}
          {!isReception && (
            <Button variant="rojo" size="sm" onClick={() => setUserToDelete(u)}>
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Usuarios">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <FilterDropdown
              filters={[
                ...(!isReception ? [{
                  key: 'rol',
                  label: 'Roles',
                  options: [
                    { value: 'all', label: 'Todos' },
                    ...roles.map((r) => ({ value: r, label: r.replace('_', ' ') })),
                  ],
                }] : []),
                {
                  key: 'estado',
                  label: 'Estados',
                  options: [
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Activos' },
                    { value: 'suspended', label: 'Suspendidos' },
                  ],
                },
              ]}
              values={filters}
              onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
              onApply={() => setFilters({ rol: 'all', estado: 'all' })}
              onOpenChange={setFilterOpen}
            />
            <div className={filterOpen ? 'invisible' : ''}>
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-125"
              />
            </div>
          </div>
          <div className={filterOpen ? 'invisible' : ''}>
            {!isReception && <Button onClick={() => setShowModal(true)}>Nuevo Usuario</Button>}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <Card padding="none">
            <Table columns={columns} data={filteredUsuarios} keyExtractor={(u) => u.id} />
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
          onNotify={(type, message) => { setToastType(type); setToastMessage(message); setShowToast(true); }}
        />
      </Modal>

      <ConfirmActionModal
        title="Confirmar suspensión"
        body="¿Estás seguro de que deseas suspender este usuario?"
        confirmLabel="Suspender"
        isOpen={!!userToSuspend}
        onConfirm={handleConfirmSuspender}
        onCancel={() => setUserToSuspend(null)}
      />
      <ConfirmActionModal
        title="Confirmar reactivación"
        body="¿Estás seguro de que deseas reactivar este usuario?"
        confirmLabel="Reactivar"
        isOpen={!!userToReactivar}
        onConfirm={handleConfirmReactivar}
        onCancel={() => setUserToReactivar(null)}
      />
      <ConfirmActionModal
        title="Confirmar eliminación"
        body="¿Estás seguro de que deseas eliminar este usuario?"
        confirmLabel="Eliminar"
        isOpen={!!userToDelete}
        onConfirm={handleDelete}
        onCancel={() => setUserToDelete(null)}
      />

      
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

interface UsuarioFormProps {
  user: User | null;
  onClose: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

function UsuarioForm({ user, onClose, onNotify }: UsuarioFormProps) {
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    rol: user?.rol || 'Administrador',
    especialidad: user?.especialidad || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        await usuariosApi.update(user.id, formData);
        onNotify?.('success', 'Usuario actualizado con éxito');
      } else {
        await usuariosApi.create(formData);
        onNotify?.('success', 'Usuario creado con éxito');
      }
      onClose();
    } catch (err) {
      const msg = (err as any)?.response?.data?.error || `Error al ${user ? 'actualizar' : 'crear'} usuario.`;
      onNotify?.('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const roles: Role[] = ['Administrador', 'Recepción', 'Profesor'];

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
        onChange={(e) => setFormData({ ...formData, rol: e.target.value as Role, especialidad: e.target.value !== 'Profesor' ? '' : formData.especialidad })}
        options={roles.map((r) => ({ value: r, label: r.replace('_', ' ') }))}
      />
      {formData.rol === 'Profesor' && (
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
        <Button variant="ghost" type="button" className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>{user ? 'Actualizar' : 'Crear'}</Button>
      </div>
    </form>
  );
}
