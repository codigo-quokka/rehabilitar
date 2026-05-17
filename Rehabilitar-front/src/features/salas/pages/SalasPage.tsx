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
import { salasApi } from "../../../api";
import { Sala } from "../../../types";
import { useAuth } from "../../../hooks/useAuth";

export function SalasPage() {
  const { hasRole } = useAuth();
  const isReception = hasRole(["reception"]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [salaIdAEliminar, setSalaIdAEliminar] = useState(String);

  const HandleDeleteClick = (id: string) => {
    setShowDeleteConfirm(true);
    setSalaIdAEliminar(id);
  };
  const handleConfirmDelete = async (id: string) => {
    try {
      await salasApi.delete(id);
      fetchData();
      setShowDeleteConfirm(false);
    } catch (err) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await salasApi.getAll();
      setSalas(data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (sala: Sala) => {
    try {
      await salasApi.update(sala.id, { activo: !sala.activo });
      fetchData();
    } catch (err) {}
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
      width: "w-1/6",
      render: (s: Sala) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="bg-primary/40 hover:bg-primary/20 text-dark-green dark:hover:bg-primary dark:bg-dark-green"
            onClick={() => setSelectedSala(s)}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-amber-200 hover:bg-amber-100 text-amber-700 dark:bg-amber-700 dark:hover:bg-amber-500"
            onClick={() => handleToggle(s)}
          >
            {s.activo ? "Desactivar" : "Activar"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-red-200 hover:bg-red-100 text-red-800 dark:bg-red-800 dark:hover:bg-red-500"
            onClick={() => HandleDeleteClick(s.id)}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Salas">
      <div className="space-y-6">
        <div className="flex justify-end">
          {!isReception && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Nueva Sala
          </Button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : salas.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-8">
              No hay salas disponibles
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
          onClose={() => {
            setShowModal(false);
            setSelectedSala(null);
            fetchData();
          }}
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
    </MainLayout>
  );
}

interface SalaFormProps {
  sala: Sala | null;
  onClose: () => void;
}

function SalaForm({ sala, onClose }: SalaFormProps) {
  const [formData, setFormData] = useState({
    nombre: sala?.nombre || "",
    capacidad: sala?.capacidad || 20,
    descripcion: sala?.descripcion || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (sala) {
        await salasApi.update(sala.id, formData);
      } else {
        await salasApi.create({ ...formData, activo: true });
      }
      onClose();
    } catch (err) {
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
        required
      />
      <Input
        label="Capacidad"
        type="number"
        min={1}
        value={formData.capacidad}
        onChange={(e) =>
          setFormData({ ...formData, capacidad: parseInt(e.target.value) })
        }
        required
      />
      <div>
        <label className="block text-sm font-medium text-dark dark:text-gray-100 mb-1.5">
          Descripción
        </label>
        <textarea
          className="w-full px-4 py-2.5 rounded-lg border border-border dark:border-gray-600 bg-white dark:bg-gray-800 text-dark dark:text-gray-100"
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
