import { useEffect, useRef, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { aptosFisicosApi } from '../../../api/aptosFisicos';
import { AptoFisico } from '../../../types';
import { Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    if (containerRef.current) {
      setPageWidth(containerRef.current.clientWidth);
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages ?? prev));
  }, [numPages]);

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

          {aptoFisico.contentType.startsWith('image/') ? (
            <img
              src={fileUrl}
              alt="Apto Físico"
              className="max-w-full h-auto mx-auto block"
            />
          ) : aptoFisico.contentType === 'application/pdf' ? (
            <div ref={containerRef} className="flex flex-col items-center w-full">
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p>Renderizando PDF...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-64 text-red-500 dark:text-red-400">
                    <p>No se pudo renderizar el PDF.</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                />
              </Document>
              {numPages && numPages > 1 && (
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-dark dark:text-gray-100 transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Página {pageNumber} de {numPages}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-dark dark:text-gray-100 transition-colors"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
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
