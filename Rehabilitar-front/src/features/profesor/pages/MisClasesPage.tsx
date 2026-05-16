import { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Table } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { profesorApi } from '../../../api';
import { Actividad } from '../../../types';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const tipoLabel: Record<string, string> = {
  TrenSuperior: 'Tren Superior',
  TrenMedio: 'Tren Medio',
  TrenInferior: 'Tren Inferior',
};

const frecuenciaLabel: Record<string, string> = {
  Esporadica: 'Esporádica',
  Recurrente: 'Recurrente',
};

const estadoLabel: Record<string, string> = {
  Propuesta: 'Propuesta',
  Aprobada: 'Aprobada',
  EnCurso: 'En Curso',
  Finalizada: 'Finalizada',
  Cancelada: 'Cancelada',
};

export function MisClasesPage() {
  const { user } = useAuth();
  const [clases, setClases] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await profesorApi.getMisClases(user.id);
        setClases(res);
      } catch {
        setClases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const columns = [
    { key: 'nombre', header: 'Actividad' },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (a: Actividad) => formatDate(a.fechaYHora),
    },
    {
      key: 'horario',
      header: 'Horario',
      render: (a: Actividad) => formatTime(a.fechaYHora),
    },
    {
      key: 'sala',
      header: 'Sala',
      render: (a: Actividad) => a.salaNombre || 'Sin sala',
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (a: Actividad) => (
        <Badge variant="info">{tipoLabel[a.tipo] || a.tipo}</Badge>
      ),
    },
    {
      key: 'frecuencia',
      header: 'Frecuencia',
      render: (a: Actividad) => (
        <Badge className="bg-secondary/20 text-secondary">
          {frecuenciaLabel[a.frecuencia] || a.frecuencia}
        </Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (a: Actividad) => {
        const variant = a.estado === 'Cancelada' ? 'warning' :
          a.estado === 'EnCurso' ? 'info' :
            a.estado === 'Aprobada' ? 'success' : 'default';
        return (
          <Badge variant={variant} className={a.estado === 'Propuesta' ? 'bg-orange-200 text-orange-700' : ''}>
            {estadoLabel[a.estado] || a.estado}
          </Badge>
        );
      },
    },
    {
      key: 'cupo',
      header: 'Cupo',
      render: (a: Actividad) => (
        <Badge variant={a.cupoDisponible > 0 ? 'success' : 'warning'}>
          {a.cupoMaximo - a.cupoDisponible}/{a.cupoMaximo}
        </Badge>
      ),
    },
  ];

  return (
    <MainLayout title="Mis Clases">
      <div className="space-y-6">
        {loading ? (
          <Card>
            <p className="text-gray-500 text-center py-8">Cargando...</p>
          </Card>
        ) : clases.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-8">No tienes clases asignadas</p>
          </Card>
        ) : (
          <Card padding="none">
            <Table columns={columns} data={clases} keyExtractor={(a) => a.id} />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}