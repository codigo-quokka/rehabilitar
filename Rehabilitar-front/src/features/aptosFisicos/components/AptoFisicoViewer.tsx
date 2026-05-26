import { useEffect, useRef, useState } from 'react';
import { aptosFisicosApi } from '../../../api/aptosFisicos';
import { AptoFisico } from '../../../types';
import { Loader2, Download } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface AptoFisicoViewerProps {
  aptoFisico: AptoFisico;
}

export const AptoFisicoViewer: React.FC<AptoFisicoViewerProps> = ({ aptoFisico }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileUrlRef = useRef<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const fetchFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { blob } = await aptosFisicosApi.getArchivo(aptoFisico.id);
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

  const [showFallback, setShowFallback] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <>
      {loading && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p>Cargando archivo...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-64 text-red-500 dark:text-red-400">
          <p>{error}</p>
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
          {!showFallback && aptoFisico.contentType.startsWith('image/') ? (
            <img
              src={fileUrl}
              alt="Apto Físico"
              className="max-w-full h-auto mx-auto block"
            />
          ) : !showFallback && aptoFisico.contentType === 'application/pdf' ? (
            <iframe
              ref={iframeRef}
              src={fileUrl}
              title="Apto Físico PDF"
              className="w-full border-none"
              style={{ height: '80vh' }}
              onError={() => setShowFallback(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No se puede mostrar la vista previa.</p>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar {aptoFisico.nombreArchivo}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};
