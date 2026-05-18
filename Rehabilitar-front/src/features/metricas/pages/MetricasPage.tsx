import { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card } from '../../../components/ui';
import { metricasApi } from '../../../api';
import { Metricas } from '../../../types';

export function MetricasPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await metricasApi.getDashboard();
        setMetricas(data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <MainLayout title="Métricas">
        <p className="text-gray-500">Cargando...</p>
      </MainLayout>
    );
  }

  if (!metricas) {
    return (
      <MainLayout title="Métricas">
        <Card>
          <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
        </Card>
      </MainLayout>
    );
  }

  const stats = [
    { label: 'Total Usuarios', value: metricas.totalUsuarios, color: 'primary' },
    { label: 'Usuarios Activos', value: metricas.usuariosActivos, color: 'success' },
    { label: 'Total Reservas', value: metricas.totalReservas, color: 'info' },
    { label: 'Reservas Confirmadas', value: metricas.reservasConfirmadas, color: 'success' },
    { label: 'Reservas Canceladas', value: metricas.reservasCanceladas, color: 'danger' },
    { label: 'Reservas Hoy', value: metricas.reservasDia, color: 'primary' },
    { label: 'Actividades Hoy', value: metricas.actividadesDia, color: 'info' },
    { label: 'Ocupación Salas', value: `${metricas.ocupacionSalas}%`, color: 'warning' },
  ];

  const colorClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700',
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  };

  return (
    <MainLayout title="Métricas">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold">Ingresos Totales</h2>
          <p className="text-4xl font-bold mt-2">${metricas.ingresosTotales.toLocaleString()}</p>
          <p className="text-sm opacity-80 mt-1">Ingresos acumulados</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className={colorClasses[stat.color]}>
              <p className="text-sm font-medium opacity-80">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">Resumen del Día</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-bg-surface dark:bg-gray-800/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Reservas realizadas</span>
                <span className="font-semibold text-dark dark:text-gray-100">{metricas.reservasDia}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-bg-surface dark:bg-gray-800/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Actividades programadas</span>
                <span className="font-semibold text-dark dark:text-gray-100">{metricas.actividadesDia}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-bg-surface dark:bg-gray-800/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Ocupación de salas</span>
                <span className="font-semibold text-dark dark:text-gray-100">{metricas.ocupacionSalas}%</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">Tasa de Cancelación</h3>
            <div className="flex items-center justify-center h-32">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200 dark:text-gray-700"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-red-500"
                    strokeDasharray={`${(metricas.reservasCanceladas / (metricas.totalReservas || 1)) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-dark dark:text-gray-100">
                    {metricas.totalReservas ? Math.round((metricas.reservasCanceladas / metricas.totalReservas) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}