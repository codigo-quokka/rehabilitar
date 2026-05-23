import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Modal } from '../../../components/ui';
import { actividadesApi, reservasApi, salasApi, usuariosApi } from '../../../api';
import { Actividad, Reserva, Sala, User } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { ActividadCard } from '../components/ActividadCard';
import { ActividadForm } from './ActividadesPage';
import { Notitoast } from '../../../components/Notitoast';

export function CalendarioPage() {
  const { user, hasRole } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [showReservasModal, setShowReservasModal] = useState(false);
  const [reservasActNombre, setReservasActNombre] = useState('');
  const [reservasData, setReservasData] = useState<Reserva[]>([]);
  const [reservasLoading, setReservasLoading] = useState(false);

  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const navigate = useNavigate();

  const profesores = usuarios.filter(u => u.rol === 'Profesor' && u.activo);

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

  const handleOpenActividad = (act: Actividad) => {
    setSelectedActividad(act);
    setShowActividadModal(true);
  };

  const handleReservar = async (actividad: Actividad) => {
    if (!user) return;
    try {
      await reservasApi.create({ actividadId: actividad.id, clienteId: user.id, tipoCliente: "noAbonado" });
      navigate("/reservas", { state: { _successMessage: '¡Reserva agregada!' } });
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
    return days;
  };

  const getActividadesForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return actividades.filter((a) => a.fechaYHora.startsWith(dateStr));
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-dark dark:text-gray-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : (
          <Card padding="none">
            <div className="grid grid-cols-7 border-b border-border dark:border-gray-700">
              {weekDays.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
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
                    className={`min-h-24 p-2 border-b border-r border-border dark:border-gray-700 ${
                      day ? 'hover:bg-gray-100 dark:hover:bg-gray-800/50' : 'bg-gray-100 dark:bg-gray-800/30'
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
                              className="w-full text-left text-xs p-1 bg-primary/10 text-primary rounded truncate hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              {new Date(act.fechaYHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} {act.nombre}
                            </button>
                          ))}
                          {dayActividades.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{dayActividades.length - 2} más
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

      <Modal
        isOpen={showActividadModal}
        onClose={() => { setShowActividadModal(false); setSelectedActividad(null); }}
        title=""
        size="lg"
      >
        <ActividadCard
          actividad={selectedActividad!}
          hasRole={hasRole}
          onReservar={handleReservar}
          onModificar={handleModificar}
          onTomarActividad={handleTomarActividad}
          onVerReservas={handleVerReservas}
        />
      </Modal>

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
