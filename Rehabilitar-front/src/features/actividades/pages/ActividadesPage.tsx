import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { MainLayout } from "../../../components/layout";
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
  FilterDropdown,
  Badge,
} from "../../../components/ui";
import { useAuth } from "../../../hooks/useAuth";
import { actividadesApi, reservasApi, salasApi, usuariosApi } from "../../../api";
import { Actividad, Sala, User, Reserva, CreateActividadRequest, CreateActividadRecurrenteRequest } from "../../../types";
import { Notitoast } from "../../../components/Notitoast";
import { ConfirmActionModal } from "../../../components/ConfirmActionModal";
import { ActividadCard } from "../components/ActividadCard";
import { RecurrenteGroup } from "../components/RecurrenteGroup";
import { tipoLabel, frecuenciaLabel, estadoLabel } from "../constants";

export function ActividadesPage() {
  const { user, hasRole } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [filters, setFilters] = useState({
    frecuencia: 'all',
    tipo: 'all',
    profesor: 'all',
    sala: 'all',
    estado: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const [reservandoId, setReservandoId] = useState<string | null>(null);

  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [showReservasModal, setShowReservasModal] = useState(false);
  const [reservasActNombre, setReservasActNombre] = useState('');
  const [reservasData, setReservasData] = useState<Reserva[]>([]);
  const [reservasLoading, setReservasLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actsResult, salasResult, usersResult] = await Promise.all([
        actividadesApi.getAll().catch(err => {
          console.error('Error fetching actividades:', err);
          return [];
        }),
        salasApi.getAll().catch(err => {
          console.error('Error fetching salas:', err);
          return [];
        }),
        usuariosApi.getAll().catch(err => {
          console.error('Error fetching usuarios:', err);
          return [];
        }),
      ]);
      setActividades(actsResult);
      setSalas(salasResult);
      setUsuarios(usersResult);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!showReservasModal) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowReservasModal(false);
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handler);
    };
  }, [showReservasModal]);

  const handleVerReservas = async (actividad: Actividad) => {
    setReservasActNombre(actividad.nombre);
    setReservasLoading(true);
    setShowReservasModal(true);
    setReservasData([]);
    try {
      const reservas = await reservasApi.getAll({ actividadId: actividad.id });
      setReservasData(reservas);
    } catch (err) {
      console.error('Error al obtener reservas:', err);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err as Error)?.message || 'Error al cargar reservas';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setReservasLoading(false);
    }
  };

  const handleReservar = async (actividad: Actividad) => {
    if (!user) return;
    setReservandoId(actividad.id);
    try {
      const reserva = await reservasApi.create({ actividadId: actividad.id, clienteId: user.id, tipoCliente: "noAbonado" });
      navigate(`/reservas/confirmar/${reserva.id}`, {
        state: {
          reservaId: reserva.id,
          actividadId: reserva.actividadId,
          montoTotal: reserva.montoTotal,
          montoPagado: 0,
          montoPendiente: reserva.montoPendiente,
        },
      });
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown> }; message?: string };
      console.error('Error al reservar:', axiosErr?.response?.status, axiosErr?.response?.data, axiosErr?.message);
      const data = axiosErr?.response?.data;
      const msg = typeof data?.error === 'string'
        ? data.error
        : typeof data?.errorCode === 'string'
          ? data.errorCode
          : typeof data?.title === 'string'
            ? data.title
            : typeof data?.message === 'string'
              ? data.message
              : axiosErr?.message ?? 'Error al realizar la reserva';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setReservandoId(null);
    }
  };

  const canManage = hasRole(["Administrador", "Recepción"]);
  const profesores = usuarios.filter(u => u.rol === 'Profesor' && u.activo);

  const filteredActividades = actividades.filter(a => {
    if (searchTerm && !a.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (dateFilterApplied) {
      const actDate = new Date(a.fechaYHora);
      if (dateFrom && actDate < new Date(dateFrom)) return false;
      if (dateTo && actDate > new Date(dateTo + 'T23:59:59')) return false;
    }
    if (hasRole(['Cliente Registrado']) && a.estado !== 'Aprobada') return false;
    if (filters.frecuencia !== 'all' && a.frecuencia !== filters.frecuencia) return false;
    if (filters.tipo !== 'all' && a.tipo !== filters.tipo) return false;
    if (filters.estado !== 'all' && a.estado !== filters.estado) return false;
    if (filters.sala !== 'all' && a.salaId !== filters.sala) return false;
    if (filters.profesor === 'all') return true;
    if (filters.profesor === 'unassigned') return !a.profesorId || a.profesorId === '00000000-0000-0000-0000-000000000000';
    if (a.profesorId !== filters.profesor) return false;
    return true;
  });

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      dateFilterApplied ||
      Object.values(filters).some(v => v !== 'all')
    );
  }, [dateFilterApplied, filters]);

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
    return (hasRole(['Cliente Registrado'])) ? 'No hay actividades disponibles' : 'No hay actividades registradas.';
  }

  const cleanFilters = () => {
    setFilters({ frecuencia: 'all', tipo: 'all', profesor: 'all', sala: 'all', estado: 'all' });
    setSearchTerm('');
  };

  const NULL_GUID = '00000000-0000-0000-0000-000000000000';

  const { grupos, individuales } = useMemo(() => {
    const gruposMap = new Map<string, Actividad[]>();
    const ind: Actividad[] = [];
    for (const act of filteredActividades) {
      if (act.serieId && act.serieId.trim() !== '' && act.serieId !== NULL_GUID) {
        if (!gruposMap.has(act.serieId)) {
          gruposMap.set(act.serieId, []);
        }
        gruposMap.get(act.serieId)!.push(act);
      } else {
        ind.push(act);
      }
    }
    const sortByDate = (a: Actividad, b: Actividad) =>
      new Date(a.fechaYHora).getTime() - new Date(b.fechaYHora).getTime();
    ind.sort(sortByDate);
    for (const [, acts] of gruposMap) {
      acts.sort(sortByDate);
    }
    const sortedGrupos = Array.from(gruposMap.entries()).sort(
      ([, actsA], [, actsB]) =>
        new Date(actsA[0].fechaYHora).getTime() - new Date(actsB[0].fechaYHora).getTime()
    );
    return { grupos: sortedGrupos, individuales: ind };
  }, [filteredActividades]);

  return (
    <MainLayout title="Actividades">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-125 h-12"
            />
            <div className="flex items-stretch gap-2 pl-4 pr-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-dark dark:text-gray-100 text-base h-12">
              <div className="flex items-center gap-1 w-22.5">
                <button
                  type="button"
                  onClick={() => dateFromRef.current?.showPicker()}
                  className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-1.5 py-1 transition-colors"
                >
                  {dateFrom ? (
                    <span className="text-xs font-medium leading-tight">
                      <span className="block">{dateFrom.split('-')[0]}</span>
                      <span className="block">{dateFrom.split('-').slice(1).join('/')}</span>
                    </span>
                  ) : (
                    <span className="text-sm font-medium">Desde</span>
                  )}
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input
                  ref={dateFromRef}
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="sr-only"
                />
              </div>
              <div className="flex items-center gap-1 w-22.5">
                <button
                  type="button"
                  onClick={() => dateToRef.current?.showPicker()}
                  className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-1.5 py-1 transition-colors"
                >
                  {dateTo ? (
                    <span className="text-xs font-medium leading-tight">
                      <span className="block">{dateTo.split('-')[0]}</span>
                      <span className="block">{dateTo.split('-').slice(1).join('/')}</span>
                    </span>
                  ) : (
                    <span className="text-sm font-medium">Hasta</span>
                  )}
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input
                  ref={dateToRef}
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="sr-only"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (dateFilterApplied) {
                    setDateFrom('');
                    setDateTo('');
                    setDateFilterApplied(false);
                  } else {
                    setDateFilterApplied(true);
                  }
                }}
                disabled={!dateFilterApplied && !dateFrom && !dateTo}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed self-center min-w-19"
              >
                {dateFilterApplied ? 'Limpiar' : 'Aplicar'}
              </button>
            </div>
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
            {hasRole(["Administrador"]) && (
              <Button
                variant="primary"
                className="px-6 py-3 justify-center whitespace-nowrap h-12"
                onClick={() => setShowModal(true)}
              >
                Nueva Actividad
              </Button>
            )}
            {hasRole(["Profesor"]) && (
              <Button
                variant="primary"
                className="px-6 py-3 justify-center whitespace-nowrap h-12"
                onClick={() => setShowModal(true)}
              >
                Proponer Actividad
              </Button>
            )}
          </div>
        </div>

        <FilterDropdown
          inline
          open={filterOpen}
          filters={[
            {
              key: 'frecuencia',
              label: 'Frecuencia',
              options: [
                { value: 'all', label: 'Todas' },
                ...Object.entries(frecuenciaLabel).map(([value, label]) => ({ value, label })),
              ],
            },
            {
              key: 'tipo',
              label: 'Especialidad',
              options: [
                { value: 'all', label: 'Todas' },
                ...Object.entries(tipoLabel).map(([value, label]) => ({ value, label })),
              ],
            },
            {
              key: 'profesor',
              label: 'Profesor',
              options: [
                { value: 'all', label: 'Todos' },
                { value: 'unassigned', label: 'Sin asignar' },
                ...profesores.map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido}` })),
              ],
            },
            {
              key: 'sala',
              label: 'Sala',
              options: [
                { value: 'all', label: 'Todas' },
                ...salas.map((s) => ({ value: s.id, label: s.nombre })),
              ],
            },
            ...(!hasRole(['Cliente Registrado'])
              ? [
                  {
                    key: 'estado',
                    label: 'Estado',
                    options: [
                      { value: 'all', label: 'Todos' },
                      ...Object.entries(estadoLabel).map(([value, label]) => ({ value, label })),
                    ],
                  },
                ]
              : []),
          ]}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onApply={() => setFilters({ frecuencia: 'all', tipo: 'all', profesor: 'all', sala: 'all', estado: 'all' })}
        />

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : filteredActividades.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grupos.map(([serieId, acts]) => (
              <RecurrenteGroup
                key={serieId}
                actividades={acts}
                hasRole={hasRole}
                salas={salas}
                profesores={profesores}
                onUpdate={fetchData}
                onReservar={handleReservar}
                onModificar={(act) => {
                  setEditingActividad(act);
                  setShowModal(true);
                }}
                onTomarActividad={async (act) => {
                  try {
                    await actividadesApi.asignarProfesor(act.id, user!.id);
                    fetchData();
                  } catch (err) {
                    console.error('Error al tomar la actividad', err);
                  }
                }}
                onVerReservas={handleVerReservas}
                onError={(msg) => {
                  setToastType('error');
                  setToastMessage(msg);
                  setShowToast(true);
                }}
              />
            ))}
            {individuales.map((act) => (
              <ActividadCard
                key={act.id}
                actividad={act}
                hasRole={hasRole}
                onReservar={handleReservar}
                onModificar={(act) => {
                  setEditingActividad(act);
                  setShowModal(true);
                }}
                onTomarActividad={async (act) => {
                  try {
                    await actividadesApi.asignarProfesor(act.id, user!.id);
                    fetchData();
                  } catch (err) {
                    console.error('Error al tomar la actividad', err);
                  }
                }}
                onVerReservas={handleVerReservas}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingActividad(null);
        }}
        title={editingActividad ? "Modificar Actividad" : "Nueva Actividad"}
        size="lg"
      >
        <ActividadForm
          actividad={editingActividad || undefined}
          onClose={() => {
            setShowModal(false);
            setEditingActividad(null);
            fetchData();
          }}
          salas={salas.filter(s => s.activo)}
          profesores={profesores}
          onError={(msg) => {
            setToastType('error');
            setToastMessage(msg);
            setShowToast(true);
          }}
          onSuccess={(msg) => {
            setToastType('success');
            setToastMessage(msg);
            setShowToast(true);
          }}
        />
      </Modal>

      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      {showReservasModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30" onClick={() => setShowReservasModal(false)} />
          <div className="relative w-full max-h-[85vh] overflow-y-auto overscroll-contain p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-6 relative">
              <button onClick={() => setShowReservasModal(false)} className="absolute -top-2 -right-2 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" aria-label="Cerrar">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-dark dark:text-gray-100">Reservas de {reservasActNombre}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{reservasData.length} reserva(s)</p>
            </div>
            {reservasLoading ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Cargando...</p>
            ) : reservasData.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Sin reservas</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservasData.map((res) => {
                  const nombre = res.nombreCliente || 'Cliente desconocido';
                  const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <Card key={res.id} className="flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-primary dark:text-primary-dark font-bold text-sm shrink-0">
                          {iniciales || '??'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-dark dark:text-gray-100 truncate">
                            {nombre}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <p>
                          {new Date(res.fechaReserva).toLocaleDateString('es-AR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-auto">
                        <Badge variant={
                          res.estadoDeReserva === 'Activa' ? 'success' :
                          res.estadoDeReserva === 'Cancelada' ? 'danger' :
                          res.estadoDeReserva === 'EnEspera' ? 'info' :
                          res.estadoDeReserva === 'PendienteDePago' ? 'warning' : 'default'
                        } className="text-xs">
                          {res.estadoDeReserva === 'PendienteDePago' ? 'Pendiente de pago' :
                           res.estadoDeReserva === 'Activa' ? 'Activa' :
                           res.estadoDeReserva === 'EnEspera' ? 'En espera' :
                           res.estadoDeReserva === 'Cancelada' ? 'Cancelada' : res.estadoDeReserva}
                        </Badge>
                        {res.montoPendiente === 0 && (
                          <Badge variant="success" className="text-xs">Pagado</Badge>
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
    </MainLayout>
  );
}

export interface ActividadFormProps {
  onClose: () => void;
  salas: Sala[];
  profesores: User[];
  actividad?: Actividad;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function ActividadForm({ onClose, salas, profesores, actividad, onError, onSuccess }: ActividadFormProps) {
  const isEditing = !!actividad;
  const { hasRole } = useAuth();
  const isAdmin = hasRole(["Administrador"]);
  const [formData, setFormData] = useState<CreateActividadRequest>(
    actividad
      ? {
          nombre: actividad.nombre,
          descripcion: actividad.descripcion,
          tipo: actividad.tipo as CreateActividadRequest['tipo'],
          frecuencia: actividad.frecuencia as CreateActividadRequest['frecuencia'],
          estado: isAdmin ? (actividad.estado as CreateActividadRequest['estado']) : 'Propuesta',
          fechaYHora: actividad.fechaYHora.slice(0, 16),
          cupoMaximo: actividad.cupoMaximo,
          salaId: actividad.salaId,
          profesorId: isAdmin ? (actividad.profesorId && actividad.profesorId !== '00000000-0000-0000-0000-000000000000' ? actividad.profesorId : undefined) : undefined,
          serieId: actividad.serieId && actividad.serieId !== '00000000-0000-0000-0000-000000000000' ? actividad.serieId : undefined,
        }
      : {
          nombre: "",
          descripcion: "",
          tipo: "TrenSuperior" as CreateActividadRequest['tipo'],
          frecuencia: "Esporadica",
          estado: "Propuesta",
          fechaYHora: "",
          cupoMaximo: 20,
          salaId: "",
          profesorId: undefined,
        },
  );
  const [loading, setLoading] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [fechaFinRecurrente, setFechaFinRecurrente] = useState("");
  const [stepFrecuencia, setStepFrecuencia] = useState(!!actividad);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const selectedSala = useMemo(() => salas.find(s => s.id === formData.salaId), [salas, formData.salaId]);

  const handleDelete = async () => {
    if (!actividad) return;
    setLoading(true);
    try {
      await actividadesApi.delete(actividad.id);
      onSuccess('Actividad eliminada exitosamente');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.errorCode ?? err?.message ?? 'Error al eliminar actividad';
      onError(msg);
    } finally {
      setShowConfirmDeleteModal(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fechaYHora || !formData.fechaYHora.split('T')[0] || !formData.fechaYHora.split('T')[1]) {
      onError('Debe seleccionar una fecha y hora.');
      return;
    }

    if (!formData.salaId) {
      onError('Debe seleccionar una sala');
      return;
    }

    if (selectedSala && formData.cupoMaximo > selectedSala.capacidad) {
      onError(`El cupo máximo no puede superar la capacidad de la sala (${selectedSala.capacidad})`);
      return;
    }

    const parsedDate = new Date(formData.fechaYHora);
    if (isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
      onError('La fecha y hora no pueden ser anteriores a las de hoy');
      return;
    }

    const dia = parsedDate.getDay();
    if (dia === 0) {
      onError('No se pueden crear actividades los domingos. El horario permitido es de lunes a sábado de 8:00 a 19:00 ');
      return;
    }

    const hora = parsedDate.getHours();
    const minutos = parsedDate.getMinutes();
    if (hora < 8 || hora > 19 || (hora === 19 && minutos > 0)) {
      onError('El horario permitido es de lunes a viernes de 8:00 a 19:00');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        fechaYHora: formData.fechaYHora.includes(':') && !formData.fechaYHora.endsWith(':00')
          ? formData.fechaYHora + ':00'
          : formData.fechaYHora,
      };
      if (isEditing && actividad) {
        await actividadesApi.update(actividad.id, payload);
      } else if (formData.frecuencia === 'Recurrente') {
        if (!fechaFinRecurrente) {
          onError('Debe seleccionar una fecha fin para la recurrencia');
          setLoading(false);
          return;
        }
        if (new Date(fechaFinRecurrente) <= new Date(formData.fechaYHora)) {
          onError('La fecha de fin de recurrencia debe ser posterior a la fecha de inicio');
          setLoading(false);
          return;
        }
        const recurrentePayload: CreateActividadRecurrenteRequest = {
          actividadBase: payload,
          fechaFinRecurrente: fechaFinRecurrente.includes(':') && !fechaFinRecurrente.endsWith(':00')
            ? fechaFinRecurrente + ':00'
            : fechaFinRecurrente,
        };
        await actividadesApi.createRecurrente(recurrentePayload);
      } else {
        await actividadesApi.create(payload);
      }
      onSuccess(isEditing ? 'Actividad modificada exitosamente' : 'Actividad creada exitosamente');
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      const fluentErrors = data?.errors;
      const firstFluentError = fluentErrors && Object.values(fluentErrors).find((v: any) => v?.[0])?.[0];
      const msg = data?.errorCode ?? firstFluentError ?? data?.error ?? err?.message ?? `Error al ${isEditing ? 'modificar' : 'crear'} actividad`;
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {!stepFrecuencia ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Seleccione el tipo de frecuencia para la actividad:</p>
          <Select
            label="Frecuencia"
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setFormData({ ...formData, frecuencia: val as CreateActividadRequest['frecuencia'] });
                setStepFrecuencia(true);
              }
            }}
            options={[
              { value: "", label: "Seleccione una frecuencia..." },
              { value: "Esporadica", label: "Esporádica" },
              { value: "Recurrente", label: "Recurrente" },
            ]}
            required
          />
        </div>
      ) : (
        <>
          <Input
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-dark dark:text-gray-100 mb-1.5">
              Descripción (opcional)
            </label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-dark dark:text-gray-100"
              rows={3}
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={formData.fechaYHora.split('T')[0] || ''}
              onChange={(e) => {
                const fecha = e.target.value;
                if (fecha) {
                  const dia = new Date(fecha + 'T12:00:00').getDay();
                  if (dia === 0) {
                    onError('No se pueden crear actividades los domingos.');
                    return;
                  }
                }
                const hora = formData.fechaYHora.split('T')[1] || '';
                setFormData({ ...formData, fechaYHora: `${fecha}T${hora}` });
              }}
              min={todayStr}
            />
            <Input
              label="Hora"
              type="time"
              value={formData.fechaYHora.split('T')[1] || ''}
              onChange={(e) => {
                const fecha = formData.fechaYHora.split('T')[0] || '';
                setFormData({ ...formData, fechaYHora: `${fecha}T${e.target.value}` });
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (!val) return;
                const [hh, mm] = val.split(':').map(Number);
                if (hh < 8) {
                  const nueva = `08:00`;
                  const fecha = formData.fechaYHora.split('T')[0] || '';
                  setFormData({ ...formData, fechaYHora: `${fecha}T${nueva}` });
                } else if (hh > 19 || (hh === 19 && mm > 0)) {
                  const nueva = `19:00`;
                  const fecha = formData.fechaYHora.split('T')[0] || '';
                  setFormData({ ...formData, fechaYHora: `${fecha}T${nueva}` });
                }
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Sala"
              value={formData.salaId}
              onChange={(e) => {
                const nuevaSala = salas.find(s => s.id === e.target.value);
                const cupoMaximo = nuevaSala && formData.cupoMaximo > nuevaSala.capacidad
                  ? nuevaSala.capacidad
                  : formData.cupoMaximo;
                setFormData({ ...formData, salaId: e.target.value, cupoMaximo });
              }}
              options={[
                { value: "", label: "Seleccione una sala..." },
                ...salas.map((s) => ({ value: s.id, label: `${s.nombre} (Cap. ${s.capacidad})` })),
              ]}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={formData.tipo}
              onChange={(e) => {
                const newTipo = e.target.value as CreateActividadRequest['tipo'];
                const profesorValido = formData.profesorId && profesores.some(
                  (p) => p.id === formData.profesorId && (!p.especialidad || p.especialidad === newTipo)
                );
                setFormData({
                  ...formData,
                  tipo: newTipo,
                  profesorId: profesorValido ? formData.profesorId : undefined,
                });
              }}
              options={[
                { value: "TrenSuperior", label: "Tren Superior" },
                { value: "TrenMedio", label: "Tren Medio" },
                { value: "TrenInferior", label: "Tren Inferior" },
              ]}
            />
            {isAdmin ? (
              <Select
                label="Estado"
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value as CreateActividadRequest['estado'] })
                }
                options={
                  isEditing
                    ? [
                        { value: "Propuesta", label: "Propuesta" },
                        { value: "Aprobada", label: "Aprobada" },
                        { value: "Cancelada", label: "Cancelada" },
                      ]
                    : [
                        { value: "Propuesta", label: "Propuesta" },
                        { value: "Aprobada", label: "Aprobada" },
                      ]
                }
              />
            ) : (
              <Input
                label={`Cupo máximo${selectedSala ? ` (máx. ${selectedSala.capacidad})` : ''}`}
                type="number"
                value={formData.cupoMaximo}
                min={1}
                max={selectedSala?.capacidad ?? 9999}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cupoMaximo: parseInt(e.target.value),
                  })
                }
                required
              />
            )}
          </div>
          {formData.frecuencia === 'Recurrente' && !isEditing && (
            <Input
              label="Fecha fin de recurrencia"
              type="datetime-local"
              value={fechaFinRecurrente}
              onChange={(e) => setFechaFinRecurrente(e.target.value)}
              required
            />
          )}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={`Cupo máximo${selectedSala ? ` (máx. ${selectedSala.capacidad})` : ''}`}
                type="number"
                value={formData.cupoMaximo}
                min={1}
                max={selectedSala?.capacidad ?? 9999}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cupoMaximo: parseInt(e.target.value),
                  })
                }
                required
              />
              <Select
                label="Profesor (opcional)"
                value={formData.profesorId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profesorId: e.target.value || undefined,
                  })
                }
                options={[
                  { value: "", label: "Sin profesor" },
                  ...profesores
                    .filter((p) => p.especialidad === formData.tipo)
                    .map((p) => ({
                      value: p.id,
                      label: `${p.nombre} ${p.apellido}`,
                    })),
                ]}
              />
            </div>
          )}
        </>
      )}

      <div className={`flex gap-3 pt-4 ${isEditing ? 'justify-between' : 'justify-end'}`}>
        {isEditing && (
          <Button
            variant="rojo"
            type="button"
            onClick={() => setShowConfirmDeleteModal(true)}
          >
            Eliminar
          </Button>
        )}
        <div className="flex gap-3">
          <Button variant="ghost" type="button" className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? "Guardar" : "Crear"}
          </Button>
        </div>
      </div>
      </form>

      <ConfirmActionModal
        isOpen={showConfirmDeleteModal}
        title="Eliminar actividad"
        body="¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDeleteModal(false)}
      />
    </>
  );
}
