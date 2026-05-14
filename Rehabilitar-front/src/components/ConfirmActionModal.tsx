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
        <p className="text-gray-600 mb-6">{body}</p>
        <div className="flex justify-center gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
