import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface MercadoFakeProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  onError: (message: string) => void;
  activityName?: string;
}

/**
 * MercadoFake — Temporary mock checkout modal for frontend development.
 *
 * Simulates a MercadoPago payment flow so the UI can be tested end-to-end
 * without real credentials. Replace with the real MercadoPago Brick/Checkout
 * integration when the backend is ready to process actual payments.
 */
export function MercadoFake({ isOpen, onClose, amount, onSuccess, onError, activityName }: MercadoFakeProps) {
  const [processing, setProcessing] = useState(false);

  const handleSuccess = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setProcessing(false);
    onSuccess();
  };

  const handleError = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 800));
    setProcessing(false);
    onError('El pago fue rechazado por el emisor. \nPrueba con otro medio o vuelve a intentar.');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mercado Pago'nt" size="sm">
      <div className="space-y-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ticket de checkout
        </p>

        {activityName && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Actividad: <span className="font-medium text-dark dark:text-gray-100">{activityName}</span>
          </p>
        )}

        <div className="py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total a pagar</p>
          <p className="text-3xl font-bold text-dark dark:text-gray-100">${amount.toFixed(2)}</p>
        </div>

        <div className="space-y-3">
          <Button
            variant="verde"
            className="w-full"
            loading={processing}
            onClick={handleSuccess}
          >
            Simular pago exitoso
          </Button>

          <Button
            variant="rojo"
            className="w-full"
            loading={processing}
            onClick={handleError}
          >
            Simular pago fallido
          </Button>
        </div>

      </div>
    </Modal>
  );
}
