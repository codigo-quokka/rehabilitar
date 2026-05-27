import { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card, Table, Badge, Button, Modal, Input, FilterDropdown } from '../../../components/ui';
import { aptosFisicosApi } from '../../../api/aptosFisicos';
import { AptoFisico } from '../../../types';
import { Notitoast } from '../../../components/Notitoast';
import { ConfirmActionModalVerde } from '../../../components/ConfirmActionModalVerde';
import { Eye, Check, X, FileText } from 'lucide-react';
import { AptoFisicoViewer } from '../components/AptoFisicoViewer';

export function AdminAptosFisicosPage() {
  const [aptos, setAptos] = useState<AptoFisico[]>([]);
  const [loading, setLoading] = useState(true);

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedApto, setSelectedApto] = useState<AptoFisico | null>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [aptoToReject, setAptoToReject] = useState<AptoFisico | null>(null);

  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [aptoToApprove, setAptoToApprove] = useState<AptoFisico | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    estado: 'all',
  });

  const filteredAptos = useMemo(() => {
    return aptos.filter(a => {
      if (filters.estado !== 'all' && a.estado !== filters.estado) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!a.clienteNombre?.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [aptos, filters, searchTerm]);


  const fetchAptos = async () => {
    setLoading(true);
    try {
      const data = await aptosFisicosApi.getAll();
      setAptos(data);
    } catch {
      showToastMessage('Error al cargar aptos físicos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAptos();
  }, []);

  const handleViewApto = (apto: AptoFisico) => {
    setSelectedApto(apto);
    setIsViewerOpen(true);
  };

  const handleApproveApto = (apto: AptoFisico) => {
    setAptoToApprove(apto);
    setIsApproveConfirmOpen(true);
  };

  const confirmApproveApto = async () => {
    if (!aptoToApprove) return;
    try {
      await aptosFisicosApi.evaluar(aptoToApprove.id, true);
      showToastMessage('Apto físico aprobado exitosamente.', 'success');
      fetchAptos();
    } catch (err) {
      console.error('Error al aprobar apto físico:', err);
      showToastMessage('Error al aprobar apto físico.', 'error');
    } finally {
      setIsApproveConfirmOpen(false);
      setAptoToApprove(null);
    }
  };

  const handleRejectApto = (apto: AptoFisico) => {
    setAptoToReject(apto);
    setIsRejectModalOpen(true);
  };

  const confirmRejectApto = async () => {
    if (!aptoToReject) return;
    try {
      await aptosFisicosApi.evaluar(aptoToReject.id, false, rejectReason);
      showToastMessage('Apto físico rechazado exitosamente.', 'success');
      fetchAptos();
    } catch (err) {
      console.error('Error al rechazar apto físico:', err);
      showToastMessage('Error al rechazar apto físico.', 'error');
    } finally {
      setIsRejectModalOpen(false);
      setAptoToReject(null);
      setRejectReason('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns = [
    { key: 'cliente', header: 'Cliente', render: (apto: AptoFisico) => apto.clienteNombre },
    {
      key: 'archivo',
      header: 'Archivo',
      render: (apto: AptoFisico) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          {apto.nombreArchivo}
        </div>
      ),
    },
    { key: 'tamaño', header: 'Tamaño', render: (apto: AptoFisico) => formatFileSize(apto.tamaño) },
    {
      key: 'fechaSubida',
      header: 'Fecha de carga',
      render: (apto: AptoFisico) => new Date(apto.fechaSubida).toLocaleDateString(),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (apto: AptoFisico) => (
        <Badge variant={apto.estado === 'Pendiente' ? 'warning' : apto.estado === 'Aprobado' ? 'success' : 'danger'}>
          {apto.estado}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      headerClass: 'text-right pr-32',
      render: (apto: AptoFisico) => (
        <div className="flex justify-end gap-2">
          
          {apto.estado === 'Pendiente' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApproveApto(apto)}
                aria-label={`Aprobar apto físico de ${apto.clienteNombre}`}
                className="text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRejectApto(apto)}
                aria-label={`Rechazar apto físico de ${apto.clienteNombre}`}
                className="text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewApto(apto)}
            aria-label={`Ver archivo de ${apto.clienteNombre}`}
            className="text-primary-600 dark:text-primary-400 hover:bg-yellow-200 dark:hover:bg-yellow-900"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Aptos Físicos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <FilterDropdown
              filters={[{
                key: 'estado',
                label: 'Estado',
                options: [
                  { value: 'all', label: 'Todos' },
                  { value: 'Pendiente', label: 'Pendiente' },
                  { value: 'Aprobado', label: 'Aprobado' },
                  { value: 'Rechazado', label: 'Rechazado' },
                ],
              }]}
              values={filters}
              onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
              onApply={() => setFilters({ estado: 'all' })}
              onOpenChange={setFilterOpen}
            />
            <div className={filterOpen ? 'invisible' : ''}>
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-125"
              />
            </div>
          </div>
        </div>
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : filteredAptos.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-8">
              No hay aptos físicos disponibles
            </p>
          </Card>
        ) : (
          <Card padding="none">
            <Table columns={columns} data={filteredAptos} keyExtractor={(apto) => apto.id} />
          </Card>
        )}
      </div>

      {/* Modal para ver apto físico */}
      <Modal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} title="Visualizar Apto Físico" size="xl">
        {selectedApto && (
          <AptoFisicoViewer aptoFisico={selectedApto} />
        )}
      </Modal>

      {/* Modal de confirmación para aprobar */}
      <ConfirmActionModalVerde
        isOpen={isApproveConfirmOpen}
        onCancel={() => setIsApproveConfirmOpen(false)}
        onConfirm={confirmApproveApto}
        title="Confirmar aprobación"
        body={`¿Estás seguro de que quieres aprobar el apto físico de ${aptoToApprove?.clienteNombre}?`}
        confirmLabel="Aprobar"
      />

      {/* Modal para rechazar apto físico */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Rechazar apto físico">
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
          <p className="text-gray-700 dark:text-gray-300">
            Ingresa el motivo por el cual se rechaza el apto físico de{' '}
            <span className="font-semibold">{aptoToReject?.clienteNombre}</span>:
          </p>
          <Input
            id="reject-reason"
            placeholder="Motivo de rechazo"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full"
            aria-label="Motivo de rechazo del apto físico"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmRejectApto} disabled={!rejectReason.trim()}>
              Rechazar
            </Button>
          </div>
        </div>
      </Modal>

      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </MainLayout>
  );
};
