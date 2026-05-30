import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Modal, FilterDropdown } from '../../../components/ui';
import { actividadesApi, reservasApi, salasApi, usuariosApi } from '../../../api';
import { Actividad, Reserva, Sala, User } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { ActividadCard } from '../components/ActividadCard';
import { ActividadForm } from './ActividadesPage';
import { Notitoast } from '../../../components/Notitoast';
import { estadoLabel, frecuenciaLabel, tipoLabel } from '../constants';

export function CalendarioPage() {
  const { user, hasRole } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [selectedDayActividades, setSelectedDayActividades] = useState<Actividad[]>([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [showReservasModal, setShowReservasModal] = useState(false);
  const [reservasActNombre, setReservasActNombre] = useState('');
  const [reservasData, setReservasData] = useState<Reserva[]>([]);
  const [reservasLoading, setReservasLoading] = useState(false);
  const [filters, setFilters] = useState({
    frecuencia: 'all',
    tipo: 'all',
    estado: 'all',
    sala: 'all',
    profesor: 'all',
  });
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const hasActiveFilters = filters.frecuencia !== 'all' || filters.tipo !== 'all' || filters.estado !== 'all' || filters.sala !== 'all' || filters.profesor !== 'all';

  const navigate = useNavigate();

  const profesores = usuarios.filter(u => u.rol === 'Profesor' && u.activo);

  const filteredActividades = actividades.filter(a => {
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const [data, salasResult, usersResult] = await Promise.all([
          actividadesApi.getAll({ fecha: `${year}-${month}` }),
          salasApi.getAll().catch(() => [] as Sala[]),
          usuariosApi.getAll().catch(() => [] as User[]),
        ]);
        setActividades(data);
        setSalas(salasResult);
        setUsuarios(usersResult);
      } catch {
        console.error('Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentDate]);

  useEffect(() => {
    if (!loading && filteredActividades.length === 0 && hasActiveFilters) {
      setToastType('error');
      setToastMessage('No hay actividades que coincidan con los filtros seleccionados');
      setShowToast(true);
    }
  }, [loading, filteredActividades.length, hasActiveFilters]);

  useEffect(() => {
    if (!showReservasModal && !showDayModal && !showActividadModal) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showReservasModal) setShowReservasModal(false);
        if (showDayModal) { setShowDayModal(false); setSelectedDayActividades([]); setSelectedDayNumber(null); }
        if (showActividadModal) { setShowActividadModal(false); setSelectedActividad(null); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handler);
    };
  }, [showReservasModal, showDayModal, showActividadModal]);

  const handleOpenActividad = (act: Actividad) => {
    setSelectedActividad(act);
    setShowActividadModal(true);
  };

  const handleOpenDay = (day: number) => {
    const acts = getActividadesForDay(day);
    setSelectedDayActividades(acts);
    setSelectedDayNumber(day);
    setShowDayModal(true);
  };

  const handleReservar = async (actividad: Actividad) => {
    if (!user) return;
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
    }
  };

  const handleVerReservas = async (actividad: Actividad) => {
    setReservasActNombre(actividad.nombre);
    setReservasLoading(true);
    setShowReservasModal(true);
    setReservasData([]);
    try {
      const reservas = await reservasApi.getAll({ actividadId: actividad.id });
      setReservasData(reservas);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err as Error)?.message || 'Error al cargar reservas';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setReservasLoading(false);
    }
  };

  const handleTomarActividad = async (act: Actividad) => {
    try {
      await actividadesApi.asignarProfesor(act.id, user!.id);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const data = await actividadesApi.getAll({ fecha: `${year}-${month}` });
      setActividades(data);
    } catch (err) {
      console.error('Error al tomar la actividad', err);
    }
  };

  const handleModificar = (act: Actividad) => {
    setShowActividadModal(false);
    setSelectedActividad(null);
    setEditingActividad(act);
    setShowEditModal(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        days.push(null);
      }
    }
    return days;
  };

  const getActividadesForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredActividades.filter((a) => a.fechaYHora.startsWith(dateStr));
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <MainLayout title="Calendario">
      <div className="space-y-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex gap-2">
            <FilterDropdown
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
          </div>
          <div className="flex items-center gap-2 justify-self-center">
            <button
              onClick={prevMonth}
              className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-dark dark:text-gray-100">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div />
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : (
          <Card padding="none">
            <div className="grid grid-cols-7 border-b border-gray-300 dark:border-gray-700">
              {weekDays.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const dayActividades = day ? getActividadesForDay(day) : [];
                const isToday = day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={`h-32 p-2 border-b-2 border-r-2  border-gray-300 dark:border-gray-800 overflow-hidden ${
                      day ? 'hover:bg-primary/10 dark:hover:bg-gray-800/50' : 'bg-primary/20 dark:bg-gray-800/30'
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-dark dark:text-gray-100'}`}>
                          {day}
                          {isToday && (
                            <span className="ml-1 text-xs text-primary">Hoy</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayActividades.slice(0, 2).map((act) => (
                            <button
                              key={act.id}
                              onClick={() => handleOpenActividad(act)}
                              className="w-full text-left text-xs p-1 dark:bg-dark-green dark:hover:bg-darkest-green dark:text-gray-100 bg-primary/50 text-dark-green rounded truncate hover:bg-primary/70 transition-colors cursor-pointer"
                            >
                              {new Date(act.fechaYHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} {act.nombre}
                            </button>
                          ))}
                          {dayActividades.length > 2 && (
                            <div
                              onClick={() => handleOpenDay(day!)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleOpenDay(day!); }}
                              role="button"
                              tabIndex={0}
                              aria-label={`Ver las ${dayActividades.length} actividades del día ${day}`}
                              className="text-xs rounded-lg justify-center bg-primary/20 hover:bg-primary/40 flex items-center text-gray-500 dark:text-gray-400 dark:bg-gray-800   dark:hover:bg-gray-700  cursor-pointer transition-colors"
                            >
                              +{dayActividades.length - 2} más - Ver todas
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {showActividadModal && selectedActividad && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30" onClick={() => { setShowActividadModal(false); setSelectedActividad(null); }} />
          <div className="relative w-full max-h-[85vh] overflow-y-auto overscroll-contain p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-6 relative">
              <button
                onClick={() => { setShowActividadModal(false); setSelectedActividad(null); }}
                className="absolute -top-4 -right-4 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-dark dark:text-gray-100">{selectedActividad.nombre}</h2>
            </div>
            <div className="max-w-lg mx-auto">
              <ActividadCard
                actividad={selectedActividad}
                hasRole={hasRole}
                onReservar={handleReservar}
                onModificar={handleModificar}
                onTomarActividad={handleTomarActividad}
                onVerReservas={handleVerReservas}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {showDayModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30" onClick={() => { setShowDayModal(false); setSelectedDayActividades([]); setSelectedDayNumber(null); }} />
          <div className="relative w-full max-h-[85vh] overflow-y-auto overscroll-contain p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-6 relative">
              <button
                onClick={() => { setShowDayModal(false); setSelectedDayActividades([]); setSelectedDayNumber(null); }}
                className="absolute -top-4 -right-4 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-dark dark:text-gray-100">
                {selectedDayNumber ? `${selectedDayNumber} de ${monthNames[currentDate.getMonth()]}` : ''}
              </h2>
              <p className="text-sm text-gray-200 dark:text-gray-400 mt-4">
                {selectedDayActividades.length} {selectedDayActividades.length === 1 ? 'actividad' : 'actividades'}
              </p>
            </div>
            {selectedDayActividades.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">Sin actividades para este día</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDayActividades.map((act) => (
                  <ActividadCard
                    key={act.id}
                    actividad={act}
                    hasRole={hasRole}
                    onReservar={handleReservar}
                    onModificar={handleModificar}
                    onTomarActividad={handleTomarActividad}
                    onVerReservas={handleVerReservas}
                  />
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
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

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingActividad(null);
        }}
        title={editingActividad ? "Modificar Actividad" : "Nueva Actividad"}
        size="lg"
      >
        <ActividadForm
          actividad={editingActividad || undefined}
          onClose={() => {
            setShowEditModal(false);
            setEditingActividad(null);
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            actividadesApi.getAll({ fecha: `${year}-${month}` }).then(setActividades);
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
    </MainLayout>
  );
}
