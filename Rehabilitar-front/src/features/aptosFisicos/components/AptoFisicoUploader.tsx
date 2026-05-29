import React, { useState, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
import { Notitoast } from '../../../components/Notitoast';
import { aptosFisicosApi } from '../../../api/aptosFisicos';
import { Upload, FileText, XCircle } from 'lucide-react';

interface AptoFisicoUploaderProps {
  onSuccess: () => void;
}

export const AptoFisicoUploader: React.FC<AptoFisicoUploaderProps> = ({ onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado local para Notitoast
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  // Helper para mostrar Notitoast
  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Tipo de archivo no permitido. Solo se aceptan JPG, PNG o PDF.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        showToastMessage(error, 'error');
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToastMessage('Por favor, selecciona un archivo para subir.', 'error');
      return;
    }

    setLoading(true);
    try {
      await aptosFisicosApi.upload(selectedFile);
      showToastMessage('Apto físico subido exitosamente.', 'success');
      setSelectedFile(null);
      onSuccess();
    } catch (error) {
      console.error('Error al subir apto físico:', error);
      showToastMessage('Error al subir apto físico. Intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
          isDragging
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400'
            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Seleccionar archivo para subir apto físico"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const error = validateFile(file);
            if (error) {
              showToastMessage(error, 'error');
              setSelectedFile(null);
            } else {
              setSelectedFile(file);
            }
          }
        }}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            {isDragging ? (
              'Suelta el archivo aquí'
            ) : (
              <>
                <span className="font-semibold">Haz click para subir</span> o arrastra y suelta
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            JPG, PNG o PDF (Máx. {MAX_FILE_SIZE_MB}MB)
          </p>
        </div>
      </div>

      {/* Hidden file input - moved outside the drop zone div */}
      <input
        id="file-upload"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".jpg,.jpeg,.png,.pdf"
        ref={fileInputRef}
        aria-label="Seleccionar archivo para subir apto físico"
      />

      {selectedFile && (
        <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500 dark:text-primary-400" />
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            aria-label="Eliminar archivo seleccionado"
            className="text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className="w-full"
        aria-label="Subir apto físico"
      >
        {loading ? 'Subiendo...' : 'Subir'}
      </Button>

      {showToast && (
        <Notitoast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};
