import { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Table } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { profesorApi } from '../../../api';
import { Actividad } from '../../../types';

export function MisClasesPage() {
  const { user } = useAuth();
  const [clases, setClases] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await profesorApi.getMisClases(user!.id);
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
    { key: 'nombre', header: 'Clase' },
    { key: 'fecha', header: 'Fecha' },
    {
      key: 'horario',
      header: 'Horario',
      render: (a: Actividad) => `${a.horaInicio} - ${a.horaFin}`,
    },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (a: Actividad) => <Badge variant="info">{a.categoria}</Badge>,
    },
    {
      key: 'inscripciones',
      header: 'Inscritos',
      render: (a: Actividad) => `${a.inscritoss} / ${a.capacidadMaxima}`,
    },
  ];

  return (
    <MainLayout title="Mis Clases">
      <div className="space-y-6">
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
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
