import { useEffect, useState } from "react";
import { MainLayout } from "../../../components/layout";
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  FilterDropdown,
} from "../../../components/ui";
import { useAuth } from "../../../hooks/useAuth";
import { actividadesApi, reservasApi, salasApi, usuariosApi } from "../../../api";
import { Actividad, Sala, User, CreateActividadRequest, CreateActividadRecurrenteRequest } from "../../../types";

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
  Cancelada: 'Cancelada',
};

export function ActividadesPage() {
  const { user, hasRole } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [filters, setFilters] = useState({
    frecuencia: 'all',
    tipo: 'all',
    profesor: 'all',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actsResult, salasResult, usersResult] = await Promise.all([
        actividadesApi.getAll().catch(err => {
          console.error('Error fetching actividades:', err);
          return [];
        }),
        salasApi.getAll().catch(err => {
          console.error('Error fetching salas:', err);
          return [];
        }),
        usuariosApi.getAll().catch(err => {
          console.error('Error fetching usuarios:', err);
          return [];
        }),
      ]);
      setActividades(actsResult);
      setSalas(salasResult);
      setUsuarios(usersResult);
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
  const profesores = usuarios.filter(u => u.rol === 'professor' && u.activo);

  const filteredActividades = actividades.filter(a => {
    if (filters.frecuencia !== 'all' && a.frecuencia !== filters.frecuencia) return false;
    if (filters.tipo !== 'all' && a.tipo !== filters.tipo) return false;
    if (filters.profesor === 'all') return true;
    if (filters.profesor === 'unassigned') return !a.profesorId || a.profesorId === '00000000-0000-0000-0000-000000000000';
    if (a.profesorId !== filters.profesor) return false;
    return true;
  });

  return (
    <MainLayout title="Actividades">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <FilterDropdown
            filters={[
              {
                key: 'frecuencia',
                label: 'Frecuencia',
                options: [
                  { value: 'all', label: 'Todas las frecuencias' },
                  ...Object.entries(frecuenciaLabel).map(([value, label]) => ({ value, label })),
                ],
              },
              {
                key: 'tipo',
                label: 'Especialidad',
                options: [
                  { value: 'all', label: 'Todas las especialidades' },
                  ...Object.entries(tipoLabel).map(([value, label]) => ({ value, label })),
                ],
              },
              {
                key: 'profesor',
                label: 'Profesor',
                options: [
                  { value: 'all', label: 'Todos los profesores' },
                  { value: 'unassigned', label: 'Sin asignar' },
                  ...profesores.map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido}` })),
                ],
              },
            ]}
            values={filters}
            onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
            onApply={() => setFilters({ frecuencia: 'all', tipo: 'all', profesor: 'all' })}
          />
          {hasRole(["admin"]) && (
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
        ) : filteredActividades.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-8">
              No hay actividades disponibles
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActividades.map((act) => (
              <Card key={act.id} className="flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-2">
                    <Badge variant="success">{tipoLabel[act.tipo] || act.tipo}</Badge>
                    <Badge className="bg-secondary/20 text-secondary">{frecuenciaLabel[act.frecuencia] || act.frecuencia}</Badge>
                    {hasRole(["admin", "professor"]) && (
                      <Badge variant={
                        act.estado === 'Cancelada' ? 'warning' :
                        act.estado === 'EnCurso' ? 'info' :
                        act.estado === 'Aprobada' ? 'success' : 'default'
                       } className={act.estado === 'Propuesta' ? 'bg-amber-100 text-amber-700' : ''}>
                        {estadoLabel[act.estado] || act.estado}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant={
                      act.cupoDisponible <= 0
                        ? "warning"
                        : "success"
                    }
                  >
                    {act.cupoMaximo - act.cupoDisponible}/{act.cupoMaximo}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-dark dark:text-gray-100 mb-2">
                  {act.nombre}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 flex-1">
                  {act.descripcion}
                </p>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
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
                    {formatDate(act.fechaYHora)}
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
                    {formatTime(act.fechaYHora)}
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
                    {act.salaNombre}
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {act.profesorNombre || "Sin profesor asignado"}
                  </div>
                </div>

                {hasRole(["registered_client", "reception"]) && (
                  <Button
                    variant={
                      act.cupoDisponible <= 0
                        ? "outline"
                        : "primary"
                    }
                    className="w-full mt-auto"
                    disabled={act.cupoDisponible <= 0}
                    onClick={() => handleReservar(act)}
                  >
                    {act.cupoDisponible <= 0
                      ? "Completo"
                      : "Reservar"}
                  </Button>
                )}
                {hasRole(["admin"]) && (
                  <Button
                    variant="primary"
                    className="w-full mt-auto"
                    onClick={() => {
                      setEditingActividad(act);
                      setShowModal(true);
                    }}
                  >
                    Modificar
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingActividad(null);
        }}
        title={editingActividad ? "Modificar Actividad" : "Nueva Actividad"}
        size="lg"
      >
        <ActividadForm
          actividad={editingActividad || undefined}
          onClose={() => {
            setShowModal(false);
            setEditingActividad(null);
            fetchData();
          }}
          salas={salas.filter(s => s.activo)}
          profesores={profesores}
        />
      </Modal>
    </MainLayout>
  );
}

interface ActividadFormProps {
  onClose: () => void;
  salas: Sala[];
  profesores: User[];
  actividad?: Actividad;
}

function ActividadForm({ onClose, salas, profesores, actividad }: ActividadFormProps) {
  const isEditing = !!actividad;
  const [formData, setFormData] = useState<CreateActividadRequest>(
    actividad
      ? {
          nombre: actividad.nombre,
          descripcion: actividad.descripcion,
          tipo: actividad.tipo as CreateActividadRequest['tipo'],
          frecuencia: actividad.frecuencia as CreateActividadRequest['frecuencia'],
          estado: actividad.estado as CreateActividadRequest['estado'],
          fechaYHora: actividad.fechaYHora.slice(0, 16),
          cupoMaximo: actividad.cupoMaximo,
          salaId: actividad.salaId,
          profesorId: actividad.profesorId || undefined,
        }
      : {
          nombre: "",
          descripcion: "",
          tipo: "TrenSuperior" as CreateActividadRequest['tipo'],
          frecuencia: "Esporadica",
          estado: "Propuesta",
          fechaYHora: "",
          cupoMaximo: 20,
          salaId: "",
          profesorId: undefined,
        },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fechaFinRecurrente, setFechaFinRecurrente] = useState("");
  const [stepFrecuencia, setStepFrecuencia] = useState(!!actividad);

  const handleDelete = async () => {
    if (!actividad) return;
    setLoading(true);
    setError(null);
    try {
      await actividadesApi.delete(actividad.id);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.title || err?.response?.data || err?.message || 'Error al eliminar actividad';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.salaId) {
      setError('Debe seleccionar una sala');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        fechaYHora: formData.fechaYHora.includes(':') && !formData.fechaYHora.endsWith(':00')
          ? formData.fechaYHora + ':00'
          : formData.fechaYHora,
      };
      if (isEditing && actividad) {
        await actividadesApi.update(actividad.id, payload);
      } else if (formData.frecuencia === 'Recurrente') {
        if (!fechaFinRecurrente) {
          setError('Debe seleccionar una fecha fin para la recurrencia');
          setLoading(false);
          return;
        }
        const recurrentePayload: CreateActividadRecurrenteRequest = {
          actividadBase: payload,
          fechaFinRecurrente: fechaFinRecurrente.includes(':') && !fechaFinRecurrente.endsWith(':00')
            ? fechaFinRecurrente + ':00'
            : fechaFinRecurrente,
        };
        await actividadesApi.createRecurrente(recurrentePayload);
      } else {
        await actividadesApi.create(payload);
      }
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.title || err?.response?.data || err?.message || `Error al ${isEditing ? 'modificar' : 'crear'} actividad`;
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!stepFrecuencia ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Seleccione el tipo de frecuencia para la actividad:</p>
          <Select
            label="Frecuencia"
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setFormData({ ...formData, frecuencia: val as CreateActividadRequest['frecuencia'] });
                setStepFrecuencia(true);
              }
            }}
            options={[
              { value: "", label: "Seleccione una frecuencia..." },
              { value: "Esporadica", label: "Esporádica" },
              { value: "Recurrente", label: "Recurrente" },
            ]}
            required
          />
        </div>
      ) : (
        <>
          <Input
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha y hora"
              type="datetime-local"
              value={formData.fechaYHora}
              onChange={(e) =>
                setFormData({ ...formData, fechaYHora: e.target.value })
              }
              required
            />
            <Select
              label="Sala"
              value={formData.salaId}
              onChange={(e) => setFormData({ ...formData, salaId: e.target.value })}
              options={[
                { value: "", label: "Seleccione una sala..." },
                ...salas.map((s) => ({ value: s.id, label: s.nombre })),
              ]}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={formData.tipo}
              onChange={(e) => {
                const newTipo = e.target.value as CreateActividadRequest['tipo'];
                const profesorValido = formData.profesorId && profesores.some(
                  (p) => p.id === formData.profesorId && (!p.especialidad || p.especialidad === newTipo)
                );
                setFormData({
                  ...formData,
                  tipo: newTipo,
                  profesorId: profesorValido ? formData.profesorId : undefined,
                });
              }}
              options={[
                { value: "TrenSuperior", label: "Tren Superior" },
                { value: "TrenMedio", label: "Tren Medio" },
                { value: "TrenInferior", label: "Tren Inferior" },
              ]}
            />
            <Select
              label="Estado"
              value={formData.estado}
              onChange={(e) =>
                setFormData({ ...formData, estado: e.target.value as CreateActividadRequest['estado'] })
              }
              options={
                isEditing
                  ? [
                      { value: "Propuesta", label: "Propuesta" },
                      { value: "Aprobada", label: "Aprobada" },
                      { value: "EnCurso", label: "En Curso" },
                      { value: "Cancelada", label: "Cancelada" },
                    ]
                  : [
                      { value: "Propuesta", label: "Propuesta" },
                      { value: "Aprobada", label: "Aprobada" },
                      { value: "EnCurso", label: "En Curso" },
                    ]
              }
            />
          </div>
          {formData.frecuencia === 'Recurrente' && !isEditing && (
            <Input
              label="Fecha fin de recurrencia"
              type="datetime-local"
              value={fechaFinRecurrente}
              onChange={(e) => setFechaFinRecurrente(e.target.value)}
              required
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cupo máximo"
              type="number"
              value={formData.cupoMaximo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cupoMaximo: parseInt(e.target.value),
                })
              }
              required
            />
            <Select
              label="Profesor (opcional)"
              value={formData.profesorId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  profesorId: e.target.value || undefined,
                })
              }
              options={[
                { value: "", label: "Sin profesor" },
                ...profesores
                  .filter((p) => !p.especialidad || p.especialidad === formData.tipo)
                  .map((p) => ({
                    value: p.id,
                    label: `${p.nombre} ${p.apellido}`,
                  })),
              ]}
            />
          </div>
        </>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className={`flex gap-3 pt-4 ${isEditing && !showDeleteConfirm ? 'justify-between' : 'justify-end'}`}>
        {isEditing && !showDeleteConfirm && (
          <Button
            variant="ghost"
            className="bg-red-100 hover:bg-red-200 text-red-700"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Eliminar
          </Button>
        )}
        {showDeleteConfirm ? (
          <div className="flex items-center gap-3 w-full justify-end">
            <span className="text-sm text-gray-600 mr-auto">
              ¿Estás seguro de eliminar esta actividad?
            </span>
            <Button variant="ghost" type="button" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={loading} onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? "Guardar" : "Crear"}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
