import { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Table, Button } from '../../../components/ui';
import { ConfirmActionModal } from '../../../components/ConfirmActionModal';
import { useAuth } from '../../../hooks/useAuth';
import { profesorApi, actividadesApi } from '../../../api';
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);

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

  const handleRemoverProfesor = async () => {
    if (!selectedActividad || !user) return;
    try {
      await actividadesApi.removerProfesor(selectedActividad.id, user.id);
      setClases(prev => prev.filter(a => a.id !== selectedActividad.id));
    } catch {
      // empty
    } finally {
      setShowConfirmModal(false);
      setSelectedActividad(null);
    }
  };

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
        <Badge className="bg-secondary/20 dark:bg-secondary/30 text-secondary dark:text-secondary">
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
            a.estado === 'Aprobada' ? 'success' :
              a.estado === 'Propuesta' ? 'amber' : 'default';
        return (
          <Badge variant={variant}>
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
    {
      key: 'acciones',
      header: 'Darse de baja',
      render: (a: Actividad) => (
        a.profesorId && a.profesorId !== '00000000-0000-0000-0000-000000000000' ? (
          <Button
            variant="rojo"
            size="sm"
            onClick={() => { setSelectedActividad(a); setShowConfirmModal(true); }}
          >
            Darse de baja
          </Button>
        ) : null
      ),
    }
  ];

  return (
    <MainLayout title="Mis Clases">
      <div className="space-y-6">
        {loading ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Cargando...</p>
          </Card>
        ) : clases.length === 0 ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tienes clases asignadas</p>
          </Card>
        ) : (
          <Card padding="none">
            <Table columns={columns} data={clases} keyExtractor={(a) => a.id} />
          </Card>
        )}
      </div>

      <ConfirmActionModal
        isOpen={showConfirmModal}
        title="¿Darse de baja?"
        body={`¿Estás seguro de que querés darte de baja de "${selectedActividad?.nombre}"?`}
        confirmLabel="Darse de baja"
        onConfirm={handleRemoverProfesor}
        onCancel={() => { setShowConfirmModal(false); setSelectedActividad(null); }}
      />
    </MainLayout>
  );
}