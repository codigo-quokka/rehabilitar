import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRModalProps {
  actividad: {
    id: string;
    nombre: string;
    fechaYHora: string;
    sala?: { nombre: string } | null;
  };
  onClose: () => void;
}

function formatFechaHora(fechaYHora: string): string {
  const d = new Date(fechaYHora);
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function QRModal({ actividad, onClose }: QRModalProps) {
  const qrUrl = `${window.location.origin}/asistencia/${actividad.id}`;

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Código QR de asistencia"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{actividad.nombre}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {formatFechaHora(actividad.fechaYHora)}
        </p>
        {actividad.sala && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{actividad.sala.nombre}</p>
        )}

        <div className="bg-white p-4 rounded-xl inline-block mb-4">
          <QRCodeSVG value={qrUrl} size={240} level="M" />
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Escaneá este código QR con tu celular para registrar tu asistencia
        </p>

        <button
          onClick={onClose}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
