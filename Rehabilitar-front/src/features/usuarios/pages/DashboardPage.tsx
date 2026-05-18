import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Badge } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { metricasApi, actividadesApi, reservasApi } from '../../../api';
import { Metricas, Actividad, Reserva } from '../../../types';

export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [actividadNombreMap, setActividadNombreMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const isAdmin = hasRole(['Administrador']);

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const fetchPromises: Promise<unknown>[] = [];

      if (isAdmin) {
        fetchPromises.push(
          metricasApi.getDashboard().then((data) => setMetricas(data))
        );
      }

      fetchPromises.push(
        actividadesApi.getAll({ fecha: today }).then((data) =>
          setActividades(data.slice(0, 5))
        )
      );

      if (user) {
        fetchPromises.push(
          reservasApi.getAll({ usuarioId: user.id }).then((data) =>
            setReservas(data.slice(0, 5))
          )
        );
      }

      await Promise.all(fetchPromises);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (reservas.length === 0) return;

    const known = actividades.reduce<Record<string, string>>((acc, a) => {
      acc[a.id] = a.nombre;
      return acc;
    }, {});

    const missing = reservas
      .filter((r) => !known[r.actividadId])
      .map((r) => r.actividadId);

    Promise.all(missing.map((id) => actividadesApi.getById(id))).then((acts) => {
      const fresh: Record<string, string> = { ...known };
      for (const a of acts) {
        fresh[a.id] = a.nombre;
      }
      setActividadNombreMap(fresh);
    });
  }, [actividades, reservas]);

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark dark:text-gray-100">
              ¡Bienvenido, {user?.nombre}!
            </h1>
            <p className="text-dark dark:text-gray-400 mt-1 text-lg">Aquí está el resumen de tu día</p>
          </div>
        </div>

        {isAdmin && metricas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
              <p className="text-sm opacity-80">Usuarios Activos</p>
              <p className="text-3xl font-bold mt-2">{metricas.usuariosActivos}</p>
              <p className="text-sm opacity-80 mt-1">de {metricas.totalUsuarios} total</p>
            </Card>

            <Card className="bg-gradient-to-br from-secondary to-dark text-white">
              <p className="text-sm opacity-80">Reservas Hoy</p>
              <p className="text-3xl font-bold mt-2">{metricas.reservasDia}</p>
              <p className="text-sm opacity-80 mt-1">{metricas.reservasConfirmadas} confirmadas</p>
            </Card>

            <Card className="bg-gradient-to-br from-primary-darker to-primary-darkest text-white">
              <p className="text-sm opacity-80">Actividades Hoy</p>
              <p className="text-3xl font-bold mt-2">{metricas.actividadesDia}</p>
              <p className="text-sm opacity-80 mt-1">programadas</p>
            </Card>

            <Card className="bg-gradient-to-br from-gray-600 to-gray-800 text-white">
              <p className="text-sm opacity-80">Ingresos Totales</p>
              <p className="text-3xl font-bold mt-2">${metricas.ingresosTotales.toLocaleString()}</p>
              <p className="text-sm opacity-80 mt-1">acumulados</p>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">Próximas actividades</h3>
            {loading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : actividades.length === 0 ? (
              <p className="text-gray-500">No hay actividades programadas</p>
            ) : (
              <div className="space-y-3">
                {actividades.map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-3 bg-bg-surface dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-dark dark:text-gray-100">{act.nombre}</p>
                      <p className="text-sm text-gray-500">{new Date(act.fechaYHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <Badge variant={act.cupoDisponible <= 0 ? 'warning' : 'success'}>
                      {act.cupoMaximo - act.cupoDisponible}/{act.cupoMaximo}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">Mis reservas</h3>
            {loading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : reservas.length === 0 ? (
              <p className="text-gray-500">No tienes reservas</p>
            ) : (
              <div className="space-y-3">
                {reservas.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-3 bg-bg-surface dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-dark dark:text-gray-100">{actividadNombreMap[res.actividadId] ?? `Actividad #${res.actividadId}`}</p>
                      <p className="text-sm text-gray-500">{res.fechaReserva}</p>
                    </div>
                    <Badge
                      variant={
                        res.estadoDeReserva === 'Activa' ? 'success' :
                        res.estadoDeReserva === 'Cancelada' ? 'danger' :
                        res.estadoDeReserva === 'EnEspera' ? 'info' :
                        res.estadoDeReserva === 'PendienteDePago' ? 'warning' : 'default'
                      }
                    >
                      {res.estadoDeReserva === 'PendienteDePago' ? 'Pendiente' :
                       res.estadoDeReserva === 'Activa' ? 'Activa' :
                       res.estadoDeReserva === 'EnEspera' ? 'En espera' :
                       res.estadoDeReserva === 'Cancelada' ? 'Cancelada' : res.estadoDeReserva}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}