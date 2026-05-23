import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { aptosFisicosApi } from '../../../api/aptosFisicos';
import { AptoFisico } from '../../../types';
import { Notitoast } from '../../../components/Notitoast';
import { Table, Badge, Button, Modal, Input } from '../../../components/ui';
import { ConfirmActionModal } from '../../../components/ConfirmActionModal';
import { Loader2, Eye, Check, X, FileText } from 'lucide-react';
import { AptoFisicoViewer } from '../components/AptoFisicoViewer';

export const AdminAptosFisicosPage: React.FC = () => {
  const [aptosPendientes, setAptosPendientes] = useState<AptoFisico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchAptosPendientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aptosFisicosApi.getPendientes();
      setAptosPendientes(data);
    } catch (err) {
      console.error('Error al obtener aptos físicos pendientes:', err);
      setError('Error al cargar los aptos físicos pendientes.');
      showToastMessage('Error al cargar aptos físicos pendientes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAptosPendientes();
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
      fetchAptosPendientes();
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
      fetchAptosPendientes();
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
      render: (apto: AptoFisico) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewApto(apto)}
            aria-label={`Ver archivo de ${apto.clienteNombre}`}
            className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleApproveApto(apto)}
            aria-label={`Aprobar apto físico de ${apto.clienteNombre}`}
            className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRejectApto(apto)}
            aria-label={`Rechazar apto físico de ${apto.clienteNombre}`}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Aptos Físicos Pendientes">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="ml-2 text-gray-700 dark:text-gray-300">Cargando aptos físicos...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 dark:text-red-400 h-64 flex items-center justify-center">
            <p>{error}</p>
          </div>
        ) : aptosPendientes.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-64 flex items-center justify-center">
            <p>No hay aptos físicos pendientes de revisión.</p>
          </div>
        ) : (
          <Table columns={columns} data={aptosPendientes} keyExtractor={(apto) => apto.id} />
        )}
      </div>

      {/* Modal para ver apto físico */}
      <Modal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} title="Visualizar Apto Físico" size="lg">
        {selectedApto && (
          <AptoFisicoViewer aptoFisico={selectedApto} onClose={() => setIsViewerOpen(false)} />
        )}
      </Modal>

      {/* Modal de confirmación para aprobar */}
      <ConfirmActionModal
        isOpen={isApproveConfirmOpen}
        onCancel={() => setIsApproveConfirmOpen(false)}
        onConfirm={confirmApproveApto}
        title="Confirmar aprobación"
        body={`¿Estás seguro de que quieres aprobar el apto físico de ${aptoToApprove?.clienteNombre}?`}
        confirmLabel="Aprobar"
      />

      {/* Modal para rechazar apto físico */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Rechazar apto físico">
        <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
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
