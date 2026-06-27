import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { MainLayout } from '../../../components/layout';
import { Card } from '../../../components/ui';
import { actividadesApi, usuariosApi } from '../../../api';
import { Actividad, User, MetricasDashboard } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CHART_COLORS = ['#4ABC8F', '#2F6274', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function BarWithLabel(props: Record<string, unknown>) {
  const x = props.x as number;
  const y = props.y as number;
  const width = props.width as number;
  const height = props.height as number;
  const fill = props.fill as string;
  const payload = props.payload as Record<string, unknown> | undefined;
  const value = (payload?.cantidad ?? payload?.porcentaje) as number | undefined;
  const displayValue = value !== undefined ? (payload?.porcentaje !== undefined ? `${value}%` : String(value)) : '';
  return (
    <g>
      <rect x={x} y={y} width={Math.max(width, 0)} height={Math.max(height, 0)} fill={fill} rx={4} />
      {displayValue && width > 20 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.5}
          paintOrder="stroke"
          fontSize={13}
          fontWeight={700}
          fontFamily="inherit"
        >
          {displayValue}
        </text>
      )}
    </g>
  );
}

function computeMetricas(actividades: Actividad[], usuarios: User[]): MetricasDashboard {
  const today = new Date().toISOString().split('T')[0];

  const actividadesHoy = actividades.filter(a => a.fechaYHora.startsWith(today));
  const enCurso = actividades.filter(a => a.estado === 'EnCurso');
  const activas = actividades.filter(a => a.estado !== 'Cancelada');

  const totalCupo = activas.reduce((sum, a) => sum + a.cupoMaximo, 0);
  const totalOcupado = activas.reduce((sum, a) => sum + (a.cupoMaximo - a.cupoDisponible), 0);
  const ocupacionGeneral = totalCupo > 0 ? Math.round((totalOcupado / totalCupo) * 100) : 0;
  const cupoPromedioOcupado = activas.length > 0
    ? Math.round(activas.reduce((sum, a) => sum + ((a.cupoMaximo - a.cupoDisponible) / a.cupoMaximo) * 100, 0) / activas.length)
    : 0;

  const profesoresSet = new Set(actividades.filter(a => a.profesorNombre).map(a => a.profesorNombre));

  const clasesPorMes = MONTHS.map((_, i) => {
    const count = actividades.filter(a => new Date(a.fechaYHora).getMonth() === i).length;
    return { mes: MONTHS[i], cantidad: count };
  });

  const profesMap = new Map<string, number>();
  actividades.forEach(a => {
    const name = a.profesorNombre || 'Sin asignar';
    profesMap.set(name, (profesMap.get(name) || 0) + 1);
  });
  const clasesPorProfesor = Array.from(profesMap.entries())
    .map(([profesor, cantidad]) => ({ profesor, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const tipoMap = new Map<string, number>();
  actividades.forEach(a => {
    tipoMap.set(a.tipo, (tipoMap.get(a.tipo) || 0) + 1);
  });
  const clasesPorTipo = Array.from(tipoMap.entries())
    .map(([tipo, cantidad]) => ({ tipo, cantidad }));

  const estadoMap = new Map<string, number>();
  actividades.forEach(a => {
    estadoMap.set(a.estado, (estadoMap.get(a.estado) || 0) + 1);
  });
  const clasesPorEstado = Array.from(estadoMap.entries())
    .map(([estado, cantidad]) => ({ estado, cantidad }));

  const salaCountMap = new Map<string, number>();
  actividades.forEach(a => {
    salaCountMap.set(a.salaNombre, (salaCountMap.get(a.salaNombre) || 0) + 1);
  });
  const totalSalaActividades = actividades.length || 1;
  const salaEntries = Array.from(salaCountMap.entries())
    .map(([sala, cantidad]) => ({ sala, cantidad, pct: (cantidad / totalSalaActividades) * 100 }));
  const sumFloored = salaEntries.reduce((s, e) => s + Math.floor(e.pct), 0);
  const diff = 100 - sumFloored;
  const sorted = [...salaEntries].sort((a, b) => (b.pct - Math.floor(b.pct)) - (a.pct - Math.floor(a.pct)));
  for (let i = 0; i < diff; i++) {
    if (sorted[i]) sorted[i].pct = Math.ceil(sorted[i].pct);
  }
  const clasesPorSala = salaEntries
    .map(e => ({ sala: e.sala, porcentaje: Math.round(e.pct) }))
    .sort((a, b) => b.porcentaje - a.porcentaje);

  return {
    totalActividades: actividades.length,
    actividadesEnCurso: enCurso.length,
    totalUsuarios: usuarios.length,
    usuariosActivos: usuarios.filter(u => u.activo).length,
    cupoPromedioOcupado,
    actividadesHoy: actividadesHoy.length,
    ocupacionGeneral,
    profesoresConClases: profesoresSet.size,
    clasesPorMes,
    clasesPorProfesor,
    clasesPorTipo,
    clasesPorEstado,
    clasesPorSala,
  };
}

export function MetricasPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [acts, users] = await Promise.all([
          actividadesApi.getAll(),
          usuariosApi.getAll(),
        ]);
        setActividades(acts);
        setUsuarios(users);
      } catch {
        setError('No hay datos disponibles');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metricas = useMemo(() => computeMetricas(actividades, usuarios), [actividades, usuarios]);

  const chartTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const chartGridColor = isDark ? '#374151' : '#E5E7EB';

  if (loading) {
    return (
      <MainLayout title="Métricas">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Métricas">
        <Card>
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">{error}</p>
        </Card>
      </MainLayout>
    );
  }

  if (metricas.totalActividades === 0 && metricas.totalUsuarios === 0) {
    return (
      <MainLayout title="Métricas">
        <Card>
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">No hay datos cargados</p>
        </Card>
      </MainLayout>
    );
  }

  const summaryCards = [
    { label: 'Total Actividades', value: metricas.totalActividades, color: 'primary' },
    { label: 'Actividades en Curso', value: metricas.actividadesEnCurso, color: 'success' },
    { label: 'Total Usuarios', value: metricas.totalUsuarios, color: 'info' },
    { label: 'Actividades Hoy', value: metricas.actividadesHoy, color: 'primary' },
  ];

  const cardColorClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary dark:bg-gray-800 dark:text-emerald-400',
    success: 'bg-green-100 text-green-700 dark:bg-gray-800 dark:text-green-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-blue-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-gray-800 dark:text-amber-400',
  };

  const estadoLabels: Record<string, string> = {
    Propuesta: 'Propuesta',
    Aprobada: 'Aprobada',
    EnCurso: 'En Curso',
    Finalizada: 'Finalizada',
    Cancelada: 'Cancelada',
  };

  const tipoLabels: Record<string, string> = {
    TrenSuperior: 'Tren Superior',
    TrenMedio: 'Tren Medio',
    TrenInferior: 'Tren Inferior',
  };

  const renderPieLabel = ({ name, percent }: { name: string; percent: number }) =>
    `${name} ${(percent * 100).toFixed(0)}%`;

  return (
    <MainLayout title="Métricas">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((stat) => (
            <Card key={stat.label} className={cardColorClasses[stat.color]}>
              <p className="text-sm font-medium opacity-80">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">
              Clases por Mes
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricas.clasesPorMes} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="mes" tick={{ fill: chartTextColor, fontSize: 12 }} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} allowDecimals={false} />
                <Bar dataKey="cantidad" fill="#4ABC8F" radius={[4, 4, 0, 0]} name="Clases" shape={<BarWithLabel />} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">
              Clases por Profesor
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={metricas.clasesPorProfesor}
                layout="vertical"
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis type="number" tick={{ fill: chartTextColor, fontSize: 12 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="profesor"
                  tick={{ fill: chartTextColor, fontSize: 11 }}
                  width={120}
                />
                <Bar dataKey="cantidad" fill="#2F6274" radius={[0, 4, 4, 0]} name="Clases" shape={<BarWithLabel />} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">
              Clases por Tipo
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metricas.clasesPorTipo.map(d => ({ ...d, name: tipoLabels[d.tipo] || d.tipo }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="cantidad"
                  label={renderPieLabel}
                  labelLine
                >
                  {metricas.clasesPorTipo.map((_, i) => (
                    <Cell key={`tipo-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(value) => <span className="text-dark dark:text-gray-100">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">
              Clases por Estado
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metricas.clasesPorEstado.map(d => ({ ...d, name: estadoLabels[d.estado] || d.estado }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="cantidad"
                  label={renderPieLabel}
                  labelLine
                >
                  {metricas.clasesPorEstado.map((_, i) => (
                    <Cell key={`estado-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(value) => <span className="text-dark dark:text-gray-100">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-4">
              Clases por Sala
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricas.clasesPorSala} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="sala" tick={{ fill: chartTextColor, fontSize: 12 }} />
                <YAxis
                  tick={{ fill: chartTextColor, fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Bar dataKey="porcentaje" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Clases" shape={<BarWithLabel />} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
