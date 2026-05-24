import React, { useEffect, useRef, useState } from 'react';
import { aptosFisicosApi } from '../../../api/aptosFisicos';
import { AptoFisico } from '../../../types';
import { useNotifications } from '../../../hooks/useNotifications';
import { Loader2, Download } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface AptoFisicoViewerProps {
  aptoFisico: AptoFisico;
  onClose: () => void;
}

export const AptoFisicoViewer: React.FC<AptoFisicoViewerProps> = ({ aptoFisico, onClose }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  const fileUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { blob, contentType, nombreArchivo } = await aptosFisicosApi.getArchivo(aptoFisico.id);
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          setFileUrl(url);
          fileUrlRef.current = url;
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error al obtener el archivo:', err);
          setError('No se pudo cargar el archivo. Intenta de nuevo más tarde.');
          setLoading(false);
        }
      }
    };

    fetchFile();

    return () => {
      cancelled = true;
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
        fileUrlRef.current = null;
      }
    };
  }, [aptoFisico.id]);

  const handleDownload = () => {
    if (fileUrl && aptoFisico.nombreArchivo) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = aptoFisico.nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-full">
      {loading && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p>Cargando archivo...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-64 text-red-500 dark:text-red-400">
          <p>{error}</p>
          <Button onClick={onClose} className="mt-4">Cerrar</Button>
        </div>
      )}

      {!loading && !error && fileUrl && (
        <>
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={handleDownload}
              aria-label="Descargar archivo"
              className="flex items-center gap-2 text-dark dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              Descargar
            </Button>
          </div>
          <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-900">
            {aptoFisico.contentType.startsWith('image/') ? (
              <img
                src={fileUrl}
                alt="Apto Físico"
                className="max-w-full h-auto mx-auto block"
                aria-label="Imagen del apto físico"
              />
            ) : aptoFisico.contentType === 'application/pdf' ? (
              <iframe
                src={fileUrl}
                title="Apto Físico PDF"
                className="w-full h-[600px] border-none"
                aria-label="Documento PDF del apto físico"
              >
                <p className="text-gray-700 dark:text-gray-300">
                  Tu navegador no soporta iframes. Puedes{' '}
                  <a href={fileUrl} download={aptoFisico.nombreArchivo} className="text-primary-600 dark:text-primary-400 underline">
                    descargar el PDF
                  </a>{' '}
                  para verlo.
                </p>
              </iframe>
            ) : (
              <p className="text-red-500 dark:text-red-400">Tipo de archivo no soportado para visualización.</p>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={onClose} variant="ghost" className="text-dark dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
              Cerrar
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
