import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Badge } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { metricasApi, actividadesApi, reservasApi, usuariosApi } from '../../../api';
import { Metricas, Actividad, Reserva, SaldoAFavor } from '../../../types';

export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [reservasCliente, setReservasCliente] = useState<Reserva[]>([]);
  const [actividadMap, setActividadMap] = useState<Record<string, Actividad>>({});
  const [saldoAFavor, setSaldoAFavor] = useState<SaldoAFavor | null>(null);
  const [InasistenciasConsecutivas, setInasistenciasConsecutivas] = useState(0);
  const [loading, setLoading] = useState(true);
  const isCliente = hasRole(['Cliente Registrado']);

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

      if (isCliente && user) {
        fetchPromises.push(
          (async () => {
            const [allReservas, userData] = await Promise.all([
              reservasApi.getAll({ usuarioId: user.id }),
              usuariosApi.getById(user.id).catch(() => null),
            ]);

            const todayStr = new Date().toISOString().split('T')[0];
            const uniqueIds = [...new Set(allReservas.map(r => r.actividadId))];
            const acts = await Promise.all(uniqueIds.map(id => actividadesApi.getById(id).catch(() => null)));
            const aMap: Record<string, Actividad> = {};
            for (const a of acts) {
              if (a) aMap[a.id] = a;
            }
            setActividadMap(aMap);

            const proximas = [...allReservas]
              .filter(r => aMap[r.actividadId]?.fechaYHora >= todayStr && (r.estadoDeReserva === 'Activa' || r.estadoDeReserva === 'PendienteDePago'))
              .sort((a, b) => (aMap[a.actividadId]?.fechaYHora ?? '').localeCompare(aMap[b.actividadId]?.fechaYHora ?? ''))
              .slice(0, 5);
            setReservasCliente(proximas);

            const sorted = [...allReservas].sort(
              (a, b) => (aMap[a.actividadId]?.fechaYHora ?? '').localeCompare(aMap[b.actividadId]?.fechaYHora ?? '')
            );
            if (userData?.InasistenciasConsecutivas !== undefined) setInasistenciasConsecutivas(userData.InasistenciasConsecutivas);
            if (userData?.saldoAFavor) setSaldoAFavor(userData.saldoAFavor);
          })()
        );
      }

      await Promise.all(fetchPromises);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [isCliente, user, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          {!hasRole(['Cliente Registrado']) &&  ( 
          <Card>
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">Próximas actividades</h3>
            {loading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : actividades.length === 0 ? (
              <p className="text-gray-500">No hay actividades programadas</p>
            ) : (
              <div className="space-y-3">
                {actividades.map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-3 bg-primary/10 dark:bg-gray-800/50 rounded-lg">
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
          )}
          {hasRole(['Cliente Registrado']) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-2 items-start">
            <Card>
              <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">Mis reservas proximas</h3>
              {loading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : reservasCliente.length === 0 ? (
                <p className="text-gray-500">No tienes reservas</p>
              ) : (
                <div className="space-y-3">
                  {reservasCliente.map((res) => (
                    <div key={res.id} className="flex items-center justify-between p-3 bg-primary/10 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-dark dark:text-gray-100">{actividadMap[res.actividadId]?.nombre ?? `Actividad #${res.actividadId}`}</p>
                        <p className="text-sm text-gray-500">
                          {actividadMap[res.actividadId]?.fechaYHora
                            ? new Date(actividadMap[res.actividadId].fechaYHora).toLocaleDateString('es-AR', {
                                year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })
                            : new Date(res.fechaReserva).toLocaleDateString('es-AR', {
                                year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          res.estadoDeReserva === 'Activa' ? 'success' :
                          res.estadoDeReserva === 'Cancelada' ? 'danger' :
                          res.estadoDeReserva === 'EnEspera' ? 'info' :
                          res.estadoDeReserva === 'PendienteDePago' ? 'warning' : 'default'
                        }
                      >
                        {res.estadoDeReserva === 'PendienteDePago' ? 'Señada' :
                         res.estadoDeReserva === 'Activa' ? 'Activa' :
                         res.estadoDeReserva === 'EnEspera' ? 'En espera' :
                         res.estadoDeReserva === 'Cancelada' ? 'Cancelada' : res.estadoDeReserva}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="flex flex-col items-center text-center space-y-2">
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-1">Saldo a favor</p>
                <p className="text-2xl font-bold text-primary">
                  ${saldoAFavor?.montoTotal.toLocaleString() ?? '0'}
                </p>
              </Card>
              <Card className="flex flex-col items-center text-center space-y-2">
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap">Inasistencias consecutivas</p>
                <p className="text-2xl justify-center font-bold text-dark dark:text-gray-100">{InasistenciasConsecutivas}</p>
                <p className="text-lg font-semibold text-red-400 dark:text-red-700 mb-1 whitespace-nowrap">Maximo 3</p>
              </Card>
            </div>
          </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}