import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MainLayout } from '../../../components/layout';
import { Card, Button, Badge, Modal, Input, Select, Table, FilterDropdown } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { usuariosApi, reservasApi, actividadesApi, profesorApi} from '../../../api';
import {aptosFisicosApi} from '../../../api/aptosFisicos';
import { User, Role, Reserva, Actividad, AptoFisico } from '../../../types';
import { Notitoast } from '../../../components/Notitoast';
import { ConfirmActionModal } from '../../../components/ConfirmActionModal';
import { InformRequirements, type Requirement } from '../../../components/InformRequirements';
import { useInputFilter } from '../../../hooks/useInputFilter';
import { INPUT_PRESETS } from '../../../utils/inputPresets';



export function UsuariosPage() {
  const { user: currentUser, hasRole } = useAuth();
  const isReception = hasRole(['Recepción']);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [aptosFisicos, setAptosFisicos] = useState<AptoFisico[]>([]);
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
    especialidad: 'all',
    aptoFisico: 'all',
  });

  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [reservasModalUser, setReservasModalUser] = useState<User | null>(null);
  const [reservasModalData, setReservasModalData] = useState<Reserva[]>([]);
  const [reservasModalLoading, setReservasModalLoading] = useState(false);
  const [reservasActividadesMap, setReservasActividadesMap] = useState<Record<string, Actividad>>({});

  const [clasesModalUser, setClasesModalUser] = useState<User | null>(null);
  const [clasesModalData, setClasesModalData] = useState<Actividad[]>([]);
  const [clasesModalLoading, setClasesModalLoading] = useState(false);

  const [pagoModal, setPagoModal] = useState<Reserva | null>(null);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [procesandoPago, setProcesandoPago] = useState(false);

  const aptosPorCliente = useMemo(() => {
    const map: Record<string, AptoFisico> = {};
    aptosFisicos.forEach(apto => {
      map[apto.clienteId] = apto;
    });
    return map;
  }, [aptosFisicos]);

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

  const ordenRoles: Record<string, number> = {
    Administrador: 0,
    Recepción: 1,
    Profesor: 2,
    'Cliente Registrado': 3,
  };

  const filteredUsuarios = usuarios
    .filter(u => {
      if (isReception && u.rol !== 'Cliente Registrado') return false;
      if (filters.rol !== 'all' && u.rol !== filters.rol) return false;
      if (filters.especialidad !== 'all' && u.especialidad !== filters.especialidad) return false;
      if (filters.estado === 'active' && !u.activo) return false;
      if (filters.estado === 'suspended' && u.activo) return false;
      if (filters.aptoFisico === 'aprobado' && aptosPorCliente[u.id]?.estado !== 'Aprobado') return false;
      if (filters.aptoFisico === 'pendiente' && aptosPorCliente[u.id]?.estado !== 'Pendiente') return false;
      if (filters.aptoFisico === 'rechazado' && aptosPorCliente[u.id]?.estado !== 'Rechazado') return false;
      if (filters.aptoFisico === 'sin_cargar' && !!aptosPorCliente[u.id]) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
        if (!fullName.includes(term) && !u.email.toLowerCase().includes(term)) return false;
      }
      return true;
    })
    .filter(u => u.id !== currentUser?.id)
    .sort((a, b) => {
      const rolDiff = (ordenRoles[a.rol] ?? 99) - (ordenRoles[b.rol] ?? 99);
      if (rolDiff !== 0) return rolDiff;
      return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
    });

  const hasActiveFilters = useMemo(() => {
    return (
      Object.values(filters).some(v => v !== 'all')
    );
  }, [filters]);

  const hasActiveSearchFilter = useMemo(() => {
    return (
      searchTerm !== ''
    );
  }, [searchTerm]);

  const getEmptyStateMessage = () => {
    if (hasActiveSearchFilter && hasActiveFilters) {
      return `No se encontraron coincidencias con los filtros de búsqueda seleccionados y la búsqueda "${searchTerm}".`
    }
    if (hasActiveSearchFilter) {
      return `No se encontraron coincidencias con la búsqueda "${searchTerm}".`
    }
    if (hasActiveFilters) {
      return 'No se encontraron coincidencias con los filtros de búsqueda seleccionados.'
    }
    return 'No hay usuarios registrados.'
  }

  const cleanFilters = () => {
    setFilters({
      rol: 'all',
      especialidad: 'all',
      estado: 'all',
      aptoFisico: 'all',
    });
    setSearchTerm('');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await usuariosApi.getAll();
      setUsuarios(data);
      try{
        const aptosData = await aptosFisicosApi.getAll();
        setAptosFisicos(aptosData);
      }
      catch(err){}

    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!reservasModalUser) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReservasModalUser(null);
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handler);
    };
  }, [reservasModalUser]);

  useEffect(() => {
    if (!clasesModalUser) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClasesModalUser(null);
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handler);
    };
  }, [clasesModalUser]);

  const handleDeleteClick = async (u: User) => {
    if (u.rol === 'Profesor') {
      try {
        const actividades = await profesorApi.getMisClases(u.id);
        const pendientes = actividades.filter(
          (a: Actividad) => a.estado !== 'Finalizada' && a.estado !== 'Cancelada'
        );
        if (pendientes.length > 0) {
          setToastType('error');
          setToastMessage('No se puede eliminar un profesor con actividades pendientes');
          setShowToast(true);
          return;
        }
      } catch {
        setToastType('error');
        setToastMessage('Error al verificar actividades del profesor');
        setShowToast(true);
        return;
      }
    }
    setUserToDelete(u);
  };

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

  const handleOpenReservas = async (u: User) => {
    setReservasModalUser(u);
    setReservasModalLoading(true);
    try {
      const [res, acts] = await Promise.all([
        reservasApi.getAll({ usuarioId: u.id }),
        actividadesApi.getAll(),
      ]);
      setReservasModalData(res);
      const actsMap: Record<string, Actividad> = {};
      acts.forEach((a) => { actsMap[a.id] = a; });
      setReservasActividadesMap(actsMap);
    } catch {
      setReservasModalData([]);
    } finally {
      setReservasModalLoading(false);
    }
  };

  const handleOpenClases = async (u: User) => {
    setClasesModalUser(u);
    setClasesModalLoading(true);
    try {
      const res = await profesorApi.getMisClases(u.id);
      setClasesModalData(res);
    } catch {
      setClasesModalData([]);
    } finally {
      setClasesModalLoading(false);
    }
  };

  const handleRegistrarPago = async () => {
    if (!pagoModal) return;
    const monto = parseFloat(montoPago);
    if (!monto || monto <= 0) {
      setToastType('error');
      setToastMessage('Ingrese un monto válido');
      setShowToast(true);
      return;
    }
    if (monto > pagoModal.montoPendiente) {
      setToastType('error');
      setToastMessage('El monto no puede superar el saldo pendiente');
      setShowToast(true);
      return;
    }
    setProcesandoPago(true);
    try {
      await reservasApi.registrarPago(pagoModal.id, {
        actividadId: pagoModal.actividadId,
        metodoPago,
        monto,
      });
      setPagoModal(null);
      if (reservasModalUser) {
        const [res, acts] = await Promise.all([
          reservasApi.getAll({ usuarioId: reservasModalUser.id }),
          actividadesApi.getAll(),
        ]);
        setReservasModalData(res);
        const actsMap: Record<string, Actividad> = {};
        acts.forEach((a) => { actsMap[a.id] = a; });
        setReservasActividadesMap(actsMap);
      }
      setToastType('success');
      setToastMessage('Pago registrado con éxito');
      setShowToast(true);
    } catch (err) {
      const msg = (err as any)?.response?.data?.error || 'Error al registrar el pago';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setProcesandoPago(false);
    }
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
    { key: 'dni', header: 'DNI', render: (u: User) =>`${u.documento}`},
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
      key: 'aptitudFisica',
      header: 'Apto Físico',
      render: (u: User) => {
        if (u.rol !== 'Cliente Registrado') return <span className="text-gray-400 dark:text-gray-500">—</span>;
        const apto = aptosPorCliente[u.id];
        if (!apto) return <Badge variant="warning">Sin cargar</Badge>;
        return (
          <Badge variant={apto.estado === 'Aprobado' ? 'success' : apto.estado === 'Rechazado' ? 'danger' : 'warning'}>
            {apto.estado === 'Aprobado' ? 'Aprobado' : apto.estado === 'Rechazado' ? 'Rechazado' : 'Pendiente'}
          </Badge>
        );
      },
    },
    {
      key: 'acciones',
      header: 'Acciones',
      headerClass: 'text-right pr-32',
      render: (u: User) => (
        <div className="flex justify-end gap-2">
          {/*
          <Button variant="verde" onClick={() => setSelectedUser(u)}>
            Editar
          </Button>
          */}
          {u.rol === 'Cliente Registrado' ? (
            <Button variant="verde" size="sm" className="min-w-[90px]" onClick={() => handleOpenReservas(u)}>
              Reservas
            </Button>
          ) : u.rol === 'Profesor' ? (
            <Button variant="verde" size="sm" className="min-w-[90px]" onClick={() => handleOpenClases(u)}>
              Clases
            </Button>
          ) : (
            <span className="min-w-[90px] inline-block" />
          )}
          {!isReception && (
           u.activo ? (
            <Button variant="naranja" size="sm" className="min-w-[100px]" onClick={() => setUserToSuspend(u)}>
              Suspender
            </Button>
          ) : (
            <Button variant="naranja" size="sm" className="min-w-[100px]" onClick={() => handleReactivar(u)}>
              Reactivar
            </Button>
          )
          )}
          {!isReception ? (
            <Button variant="rojo" size="sm" onClick={() => handleDeleteClick(u)}>
              Eliminar
            </Button>
          ) : (
            <span className="min-w-[70px] inline-block" />
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
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-125"
            />
            <Button
              variant="verde"
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className="border-none gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
                Filtros
              <svg className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
          <div>
            {!isReception && <Button onClick={() => setShowModal(true)}>Nuevo Usuario</Button>}
          </div>
        </div>

        <FilterDropdown
          inline
          open={filterOpen}
          filters={[
            ...(!isReception ? [{
              key: 'rol',
              label: 'Roles',
              options: [
                { value: 'all', label: 'Todos' },
                ...roles.map((r) => ({ value: r, label: r.replace('_', ' ') })),
              ],
            },
            ...(filters.rol === 'Profesor' ? [{
              key: 'especialidad',
              label: 'Especialidad',
              options: [
                { value: 'all', label: 'Todas' },
                { value: 'TrenSuperior', label: 'Tren Superior' },
                { value: 'TrenMedio', label: 'Tren Medio' },
                { value: 'TrenInferior', label: 'Tren Inferior' },
              ],
            }] : []),
             ...(filters.rol === 'Cliente Registrado' ? [{
              key: 'aptoFisico',
              label: 'Apto Físico',
              options: [
                { value: 'all', label: 'Todos' },
                { value: 'aprobado', label: 'Aprobado' },
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'rechazado', label: 'Rechazado' },
                { value: 'sin_cargar', label: 'Sin cargar' },
              ],
            }] : [])] : []),
            {
              key: 'estado',
              label: 'Estados',
              options: [
                { value: 'all', label: 'Todos' },
                { value: 'active', label: 'Activos' },
                { value: 'suspended', label: 'Suspendidos' },
              ],
            },
            {
              key: 'aptoFisico',
              label: 'Apto Físico',
              options: [
                { value: 'all', label: 'Todos' },
                { value: 'aprobado', label: 'Aprobado' },
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'rechazado', label: 'Rechazado' },
                { value: 'sin_cargar', label: 'Sin cargar' },
              ],
            },
          ]}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onApply={() => setFilters({ rol: 'all', estado: 'all', especialidad: 'all', aptoFisico: 'all' })}
        />

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : filteredUsuarios.length === 0 ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {getEmptyStateMessage()}
            </p>
            {(hasActiveFilters || hasActiveSearchFilter) && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="ghost"
                  className="px-4 py-2 justify-center whitespace-nowrap h-10 hover:bg-primary/20 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                  cleanFilters();
                }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </Card>
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

      {reservasModalUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30" onClick={() => setReservasModalUser(null)} />
          <div className="relative w-full max-h-[85vh] overflow-y-auto overscroll-contain p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-6 relative">
              <button onClick={() => setReservasModalUser(null)} className="absolute -top-4 -right-4 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" aria-label="Cerrar">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-dark dark:text-gray-100">Reservas de {reservasModalUser.nombre} {reservasModalUser.apellido}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{reservasModalData.length} reserva(s)</p>
            </div>
            {reservasModalLoading ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Cargando...</p>
            ) : reservasModalData.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Sin reservas</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservasModalData.map((res) => {
                  const act = reservasActividadesMap[res.actividadId];
                  const completado = res.montoPendiente === 0;
                  return (
                    <Card key={res.id} className="flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant={
                          res.estadoDeReserva === 'Activa' ? 'success' :
                          res.estadoDeReserva === 'Cancelada' ? 'danger' :
                          res.estadoDeReserva === 'EnEspera' ? 'info' :
                          res.estadoDeReserva === 'PendienteDePago' ? 'warning' : 'default'
                        }>
                          {res.estadoDeReserva === 'PendienteDePago' ? 'Pendiente de pago' :
                           res.estadoDeReserva === 'Activa' ? 'Activa' :
                           res.estadoDeReserva === 'EnEspera' ? 'En espera' :
                           res.estadoDeReserva === 'Cancelada' ? 'Cancelada' : res.estadoDeReserva}
                        </Badge>
                        {completado && <Badge variant="success">Pagado</Badge>}
                      </div>
                      <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-2">{act?.nombre || 'Actividad'}</h3>
                      {act && (
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(act.fechaYHora).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(act.fechaYHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-dark dark:text-gray-100 space-y-1 mt-auto">
                        <p>Pagado: <span className="font-semibold">${(res.montoTotal - res.montoPendiente).toFixed(2)}</span> / <span className="font-semibold">${res.montoTotal.toFixed(2)}</span></p>
                        {!completado && (res.estadoDeReserva === 'PendienteDePago' || res.estadoDeReserva === 'Activa') && (
                          <Button variant="primary" size="sm" className="w-full mt-2" onClick={() => { setPagoModal(res); setMontoPago(String(res.montoPendiente)); setMetodoPago('Efectivo'); }}>
                            Cobrar
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {pagoModal && createPortal(
        <Modal isOpen onClose={() => setPagoModal(null)} title="Registrar Pago" size="sm">
          <div className="space-y-3 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Actividad: <span className="font-semibold text-dark dark:text-gray-100">{reservasActividadesMap[pagoModal.actividadId]?.nombre || '—'}</span></p>
            <p>Total: <span className="font-semibold text-dark dark:text-gray-100">${pagoModal.montoTotal.toFixed(2)}</span></p>
            <p>Pendiente: <span className="font-semibold text-primary">${pagoModal.montoPendiente.toFixed(2)}</span></p>
          </div>
          <div className="space-y-4">
            <Input
              label="Monto a cobrar"
              type="number"
              step="0.01"
              min="0.01"
              max={pagoModal.montoPendiente}
              value={montoPago}
              onChange={(e) => setMontoPago(e.target.value)}
              required
            />
            <Select
              label="Método de pago"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              options={[
                { value: 'Efectivo', label: 'Efectivo' },
                { value: 'MercadoPago', label: 'Mercado Pago' },
                { value: 'RehabiliCoins', label: 'RehabiliCoins' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-6">
            <Button variant="ghost" type="button" className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setPagoModal(null)}>Cancelar</Button>
            <Button variant="primary" loading={procesandoPago} onClick={handleRegistrarPago}>Registrar Pago</Button>
          </div>
        </Modal>,
        document.body
      )}

      {clasesModalUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30" onClick={() => setClasesModalUser(null)} />
          <div className="relative w-full max-h-[85vh] overflow-y-auto overscroll-contain p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-6 relative">
              <button onClick={() => setClasesModalUser(null)} className="absolute -top-4 -right-4 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" aria-label="Cerrar">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-dark dark:text-gray-100">Clases de {clasesModalUser.nombre} {clasesModalUser.apellido}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{clasesModalData.length} clase(s)</p>
            </div>
            {clasesModalLoading ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Cargando...</p>
            ) : clasesModalData.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Sin clases asignadas</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clasesModalData.map((act) => (
                  <Card key={act.id} className="flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="success">{act.tipo === 'TrenSuperior' ? 'Tren Superior' : act.tipo === 'TrenMedio' ? 'Tren Medio' : 'Tren Inferior'}</Badge>
                      <Badge variant={
                        act.estado === 'Cancelada' ? 'warning' :
                        act.estado === 'EnCurso' ? 'info' :
                        act.estado === 'Aprobada' ? 'success' :
                        act.estado === 'Propuesta' ? 'amber' : 'default'
                      }>
                        {act.estado === 'EnCurso' ? 'En Curso' : act.estado}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-2">{act.nombre}</h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(act.fechaYHora).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(act.fechaYHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {act.salaNombre || 'Sin sala'}
                      </div>
                    </div>
                    <div className="text-sm text-dark dark:text-gray-100 mt-auto">
                      <span className="font-medium">{act.cupoMaximo - act.cupoDisponible}/{act.cupoMaximo}</span> cupos
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
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
  const MIN_DNI_LENGTH = 7;
  const MAX_DNI_LENGTH = 8;
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const dniReqs: Requirement[] = [
    { label: 'Mínimo 7 caracteres', test: (v) => v.length >= 7 },
  ];

  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    dni: user?.documento || '',
    fechaNacimiento: user?.fechaNacimiento || '',
    telefono: user?.telefono || '',
    rol: user?.rol || 'Administrador',
    especialidad: user?.especialidad || '',
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nombreFilter = useInputFilter(formData.nombre, (v) => updateField('nombre', v), INPUT_PRESETS.name);
  const apellidoFilter = useInputFilter(formData.apellido, (v) => updateField('apellido', v), INPUT_PRESETS.name);
  const dniFilter = useInputFilter(formData.dni, (v) => updateField('dni', v), INPUT_PRESETS.digits(MAX_DNI_LENGTH));
  const telefonoFilter = useInputFilter(formData.telefono, (v) => updateField('telefono', v), INPUT_PRESETS.digits(12));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.apellido || !formData.email || !formData.dni || !formData.fechaNacimiento) {
      onNotify?.('error', 'Por favor, completa todos los campos obligatorios.');
      return;
    }
    if (formData.dni.length < MIN_DNI_LENGTH) {
      onNotify?.('error', `Ingrese un DNI válido`);
      return;
    }
    if (formData.rol === 'Profesor' && !formData.especialidad) {
      onNotify?.('error', 'Debe seleccionar una especialidad para el profesor');
      return;
    }
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
      const apiMsg = (err as any)?.response?.data?.error;
      const msg = apiMsg && apiMsg.includes("is already taken")
        ? "El correo ingresado ya se encuentra en uso"
        : apiMsg || `Error al ${user ? 'actualizar' : 'crear'} usuario.`;
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
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          onKeyDown={nombreFilter.handleKeyDown}
          onPaste={nombreFilter.handlePaste}
        />
        <Input
          label="Apellido"
          name="apellido"
          value={formData.apellido}
          onChange={handleChange}
          onKeyDown={apellidoFilter.handleKeyDown}
          onPaste={apellidoFilter.handlePaste}
        />
      </div>
      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
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
        <Input
          label="Fecha de nacimiento"
          type="date"
          name="fechaNacimiento"
          value={formData.fechaNacimiento}
          onChange={handleChange}
          min="1900-01-01"
          max={todayStr}
        />
      </div>
      <Input
        label="Teléfono (opcional)"
        type="tel"
        name="telefono"
        value={formData.telefono}
        onChange={handleChange}
        onKeyDown={telefonoFilter.handleKeyDown}
        onPaste={telefonoFilter.handlePaste}
        placeholder="+54 221 123 4567"
        maxLength={12}
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
              { value: '', label: 'Seleccione una especialidad', disabled: true },
              { value: 'TrenSuperior', label: 'Tren Superior' },
              { value: 'TrenMedio', label: 'Tren Medio' },
              { value: 'TrenInferior', label: 'Tren Inferior' },
            ]}
          />
      )}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" type="button" className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>{user ? 'Actualizar' : 'Crear'}</Button>
      </div>
    </form>
  );
}
