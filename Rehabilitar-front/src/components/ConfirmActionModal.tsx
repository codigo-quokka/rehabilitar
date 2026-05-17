import { Modal, Button } from './ui';

interface ConfirmActionModalProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function ConfirmActionModal({ title, body, confirmLabel, onConfirm, onCancel, isOpen }: ConfirmActionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-6">{body}</p>
        <div className="flex justify-center gap-3">
          <Button variant="ghost" className="text-dark dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="rojo" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
