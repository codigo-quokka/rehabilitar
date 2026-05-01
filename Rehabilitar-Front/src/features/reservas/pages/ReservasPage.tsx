import { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Badge, Table, Button } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { reservasApi, actividadesApi } from '../../../api';
import { Reserva, Actividad } from '../../../types';

export function ReservasPage() {
  const { user, hasRole } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [actividades, setActividades] = useState<Record<string, Actividad>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = hasRole(['admin', 'reception']) ? {} : { usuarioId: user?.id };
        const res = await reservasApi.getAll(params);
        setReservas(res);

        const acts = await actividadesApi.getAll();
        const actsMap: Record<string, Actividad> = {};
        acts.forEach((a) => { actsMap[a.id] = a; });
        setActividades(actsMap);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, hasRole]);

  const handleCancelar = async (id: string) => {
    try {
      await reservasApi.update(id, { estado: 'cancelada', fechaCancelacion: new Date().toISOString() });
      setReservas(reservas.map((r) => r.id === id ? { ...r, estado: 'cancelada' } : r));
    } catch (err) {
    }
  };

  const canManage = hasRole(['admin', 'reception']);

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'actividad',
      header: 'Actividad',
      render: (r: Reserva) => actividades[r.actividadId]?.nombre || r.actividadId,
    },
    { key: 'fechaReserva', header: 'Fecha' },
    {
      key: 'estado',
      header: 'Estado',
      render: (r: Reserva) => {
        const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
          confirmada: 'success',
          cancelada: 'danger',
          completada: 'info',
          asistio: 'success',
          no_asistio: 'danger',
        };
        return <Badge variant={variants[r.estado] || 'default'}>{r.estado}</Badge>;
      },
    },
    ...(canManage ? [
      {
        key: 'metodoPago',
        header: 'Pago',
        render: (r: Reserva) => r.metodoPago || '-',
      },
    ] : []),
    {
      key: 'acciones',
      header: 'Acciones',
      render: (r: Reserva) => (
        r.estado === 'confirmada' && (
          <Button variant="ghost" size="sm" onClick={() => handleCancelar(r.id)}>
            Cancelar
          </Button>
        )
      ),
    },
  ];

  return (
    <MainLayout title="Mis Reservas">
      <div className="space-y-6">
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : reservas.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-8">No tienes reservas</p>
          </Card>
        ) : (
          <Card padding="none">
            <Table columns={columns} data={reservas} keyExtractor={(r) => r.id} />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}