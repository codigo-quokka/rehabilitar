import { useEffect, useState } from "react";
import { MainLayout } from "../../../components/layout";
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Table,
} from "../../../components/ui";
import { ConfirmActionModal } from "../../../components/ConfirmActionModal";
import { Notitoast } from "../../../components/Notitoast";
import { useImportantNotification } from '../../../hooks/useImportantNotification';
import { salasApi, actividadesApi } from "../../../api";
import { Sala, Actividad } from "../../../types";
import { useAuth } from "../../../hooks/useAuth";

export function SalasPage() {
  const { hasRole } = useAuth();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDesactivarConfirm, setShowDesactivarConfirm] = useState(false);
  const [salaIdAEliminar, setSalaIdAEliminar] = useState('');
  const [salaADesactivar, setSalaADesactivar] = useState<Sala | null>(null);

  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const importantNotification = useImportantNotification();


  const tieneActividadesPendientes = (salaId: string): boolean => {
    return actividades.some(
      (a) => a.salaId === salaId && a.estado !== 'Finalizada' && a.estado !== 'Cancelada'
    );
  };

  const HandleDeleteClick = (id: string) => {
    if (tieneActividadesPendientes(id)) {
      setToastType('error');
      setToastMessage('No se puede eliminar una sala con actividades pendientes.');
      setShowToast(true);
      return;
    }
    setShowDeleteConfirm(true);
    setSalaIdAEliminar(id);
  };
  const HandleDesactivarClick = (s: Sala) => {
    setShowDesactivarConfirm(true);
    setSalaADesactivar(s);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await salasApi.delete(id);
      fetchData();
      setShowDeleteConfirm(false);
      await importantNotification({ type: 'success', message: 'Sala eliminada exitosamente.' });
    } catch (err) {
      setShowDeleteConfirm(false);
      const msg = (err as any)?.response?.data?.error || 'Error al eliminar la sala.';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salasData, actividadesData] = await Promise.all([
        salasApi.getAll(),
        actividadesApi.getAll(),
      ]);
      setSalas(salasData);
      setActividades(actividadesData);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmDesactivar = async () => {
    if (!salaADesactivar) return;
    try {
      await salasApi.update(salaADesactivar.id, { activo: !salaADesactivar.activo });
      fetchData();
      setShowDesactivarConfirm(false);
      setSalaADesactivar(null);
      if (salaADesactivar.activo) {
        await importantNotification({ type: 'info', message: 'Sala desactivada correctamente, no se podrán crear nuevas actividades con esta sala' });
      } else {
        await importantNotification({ type: 'success', message: 'Sala activada exitosamente.' });
      }
    } catch (err) {
      setShowDesactivarConfirm(false);
      setSalaADesactivar(null);
      const msg = (err as any)?.response?.data?.error || 'Error al actualizar la sala.';
      setToastType('error');
      setToastMessage(msg);
      setShowToast(true);
    }
  };

  const columns = [
    { key: "nombre", header: "Nombre", width: "w-1/6" },
    { key: "capacidad", header: "Capacidad", width: "w-1/6" },
    { key: "descripcion", header: "Descripción", width: "w-1/3" },
    {
      key: "estado",
      header: "Estado",
      width: "w-1/6",
      render: (s: Sala) => (
        <Badge variant={s.activo ? "success" : "danger"}>
          {s.activo ? "Activa" : "Inactiva"}
        </Badge>
      ),
    },
    { 
      key: "acciones",
      header: "Acciones",
      headerClass: "text-right pr-32",
      width: "w-1/6",
      render: (s: Sala) => (
        <div className="flex gap-2">
          {hasRole(['Administrador']) && (
            <>
              <Button
                variant="verde"
                size="sm"
                onClick={() => setSelectedSala(s)}
              >
                Editar
              </Button>
              <Button
                variant="naranja"
                size="sm"
                onClick={() => HandleDesactivarClick(s)}
              >
                {s.activo ? "Desactivar" : "Activar"}
              </Button>
              {/* 
              <Button
                variant="rojo"
                size="sm"
                onClick={() => HandleDeleteClick(s.id)}
              >
                Eliminar
              </Button>
              */}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Salas">
      <div className="space-y-6">
        <div className="flex justify-end">
          {hasRole(['Administrador']) && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Nueva Sala
          </Button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : salas.length === 0 ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No hay salas registradas
            </p>
          </Card>
        ) : (
          <Card padding="none">
            <Table columns={columns} data={salas} keyExtractor={(s) => s.id} />
          </Card>
        )}
      </div>

      <Modal
        isOpen={showModal || !!selectedSala}
        onClose={() => {
          setShowModal(false);
          setSelectedSala(null);
        }}
        title={selectedSala ? "Editar Sala" : "Nueva Sala"}
      >
        <SalaForm
          sala={selectedSala}
          tieneActividadesPendientes={selectedSala ? tieneActividadesPendientes(selectedSala.id) : false}
          onClose={() => {
            setShowModal(false);
            setSelectedSala(null);
            fetchData();
          }}
          onNotify={(type, message) => { setToastType(type); setToastMessage(message); setShowToast(true); }}
        />
      </Modal>
      <ConfirmActionModal
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => handleConfirmDelete(salaIdAEliminar)}
        title="Confirmar eliminación"
        body="¿Estás seguro de que deseas eliminar la sala?"
        confirmLabel="Eliminar"
      />
      <ConfirmActionModal
        isOpen={showDesactivarConfirm}
        onCancel={() => { setShowDesactivarConfirm(false); setSalaADesactivar(null); }}
        onConfirm={handleConfirmDesactivar}
        title={salaADesactivar?.activo ? 'Confirmar desactivación' : 'Confirmar activación'}
        body={salaADesactivar?.activo
          ? `¿Estás seguro de que deseas desactivar la sala "${salaADesactivar.nombre}"?`
          : `¿Estás seguro de que deseas activar la sala "${salaADesactivar?.nombre}"?`}
        confirmLabel={salaADesactivar?.activo ? 'Desactivar' : 'Activar'}
      />

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

interface SalaFormProps {
  sala: Sala | null;
  tieneActividadesPendientes: boolean;
  onClose: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

function SalaForm({ sala, tieneActividadesPendientes, onClose, onNotify }: SalaFormProps) {
  const importantNotification = useImportantNotification();
  const [formData, setFormData] = useState({
    nombre: sala?.nombre || "",
    capacidad: sala?.capacidad || 20,
    descripcion: sala?.descripcion || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.capacidad) {
      onNotify?.('error', 'Por favor, completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      if (sala) {
        if (formData.capacidad < sala.capacidad && tieneActividadesPendientes) {
          onNotify?.('error', 'No se puede reducir la capacidad de una sala con actividades pendientes.');
          setLoading(false);
          return;
        }
        await salasApi.update(sala.id, formData);
        await importantNotification({ type: 'success', message: 'Sala actualizada exitosamente.' });
      } else {
        await salasApi.create({ ...formData, activo: true });
        await importantNotification({ type: 'success', message: 'Sala creada exitosamente.' });
      }
      onClose();
    } catch (err) {
      const apiMsg = (err as any)?.response?.data?.error;
      const msg = apiMsg && apiMsg.toLowerCase().includes("a conflict error has occurred.")
        ? "Ya existe una sala con ese nombre"
        : apiMsg || `Error al ${sala ? 'actualizar' : 'crear'} la sala.`;
      onNotify?.('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre"
        value={formData.nombre}
        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        placeholder="Sin nombre"
      />
      <Input
        label="Capacidad"
        type="number"
        min={1}
        value={formData.capacidad}
        onChange={(e) =>
          setFormData({ ...formData, capacidad: parseInt(e.target.value) })
        }
      />
      <div>
        <label className="block text-sm font-medium text-dark dark:text-gray-100 mb-1.5">
          Descripción (opcional)
        </label>
        <textarea
          className="w-full px-4 py-2.5 rounded-lg border border-border dark:border-gray-600 bg-white dark:bg-gray-600 text-dark dark:text-gray-100"
          rows={3}
          value={formData.descripcion}
          onChange={(e) =>
            setFormData({ ...formData, descripcion: e.target.value })
          }
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" type="button" className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {sala ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
