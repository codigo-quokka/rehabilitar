import { useEffect, useState } from "react";
import { MainLayout } from "../../../components/layout";
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
} from "../../../components/ui";
import { useAuth } from "../../../hooks/useAuth";
import { actividadesApi, reservasApi, salasApi } from "../../../api";
import { Actividad, Sala } from "../../../types";

export function ActividadesPage() {
  const { user, hasRole } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(
    null,
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actsResult, salasResult] = await Promise.all([
        actividadesApi.getAll().catch(err => {
          console.error('Error fetching actividades:', err);
          return [];
        }),
        salasApi.getAll().catch(err => {
          console.error('Error fetching salas:', err);
          return [];
        }),
      ]);
      setActividades(actsResult);
      setSalas(salasResult);
    } finally {
      setLoading(false);
    }
};

  useEffect(() => {
    fetchData();
  }, []);

  const handleReservar = async (actividad: Actividad) => {
    if (!user) return;
    try {
      await reservasApi.create({ actividadId: actividad.id });
      fetchData();
    } catch (err) {}
  };

  const canManage = hasRole(["admin", "reception"]);

  return (
    <MainLayout title="Actividades">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-gray-500">
            Explora las actividades disponibles y reserva tu lugar
          </div>
          {canManage && (
            <Button
              className="px-6 py-3 justify-center whitespace-nowrap"
              onClick={() => setShowModal(true)}
            >
              Nueva Actividad
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : actividades.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-8">
              No hay actividades disponibles
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actividades.map((act) => (
              <Card key={act.id} className="flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="info">{act.categoria}</Badge>
                  <Badge
                    variant={
                      act.inscritoss >= act.capacidadMaxima
                        ? "warning"
                        : "success"
                    }
                  >
                    {act.inscritoss}/{act.capacidadMaxima}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-dark mb-2">
                  {act.nombre}
                </h3>
                <p className="text-gray-500 text-sm mb-4 flex-1">
                  {act.descripcion}
                </p>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {act.fecha}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {act.horaInicio} - {act.horaFin}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Sala #{act.salaId}
                  </div>
                </div>

                {hasRole(["registered_client", "admin", "reception"]) && (
                  <Button
                    variant={
                      act.inscritoss >= act.capacidadMaxima
                        ? "outline"
                        : "primary"
                    }
                    className="w-full mt-auto"
                    disabled={act.inscritoss >= act.capacidadMaxima}
                    onClick={() => handleReservar(act)}
                  >
                    {act.inscritoss >= act.capacidadMaxima
                      ? "Completo"
                      : "Reservar"}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Actividad"
        size="lg"
      >
        <ActividadForm
          onClose={() => {
            setShowModal(false);
            fetchData();
          }}
          salas={salas.filter(s => s.activo)}
        />
      </Modal>
    </MainLayout>
  );
}

interface ActividadFormProps {
  onClose: () => void;
  salas: Sala[];
}

function ActividadForm({ onClose, salas }: ActividadFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    capacidadMaxima: 20,
    categoria: "rehabilitacion",
    salaId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await actividadesApi.create({
        ...formData,
        activo: true,
        profesorId: "",
      });
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
      <div>
        <label className="block text-sm font-medium text-dark mb-1.5">
          Descripción
        </label>
        <textarea
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white"
          rows={3}
          value={formData.descripcion}
          onChange={(e) =>
            setFormData({ ...formData, descripcion: e.target.value })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha"
          type="date"
          value={formData.fecha}
          onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
          required
          
        />
        <Select
          label="Sala"
          value={formData.salaId}
          onChange={(e) => setFormData({ ...formData, salaId: e.target.value })}
          options={salas.map((s) => ({ value: s.id, label: s.nombre }))}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Hora inicio"
          type="time"
          value={formData.horaInicio}
          onChange={(e) =>
            setFormData({ ...formData, horaInicio: e.target.value })
          }
          required
        />
        <Input
          label="Hora fin"
          type="time"
          value={formData.horaFin}
          onChange={(e) =>
            setFormData({ ...formData, horaFin: e.target.value })
          }
          required
        />
        <Input
          label="Capacidad"
          type="number"
          value={formData.capacidadMaxima}
          onChange={(e) =>
            setFormData({
              ...formData,
              capacidadMaxima: parseInt(e.target.value),
            })
          }
          required
        />
      </div>
      <Select
        label="Categoría"
        value={formData.categoria}
        onChange={(e) =>
          setFormData({ ...formData, categoria: e.target.value })
        }
        options={[
          { value: "trensuperior", label: "Tren Superior" },
          { value: "trenmedio", label: "Tren Medio" },
          { value: "treninferior", label: "Tren Inferior" },
        ]}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" type="button" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Crear
        </Button>
      </div>
    </form>
  );
}
