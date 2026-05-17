import React, { useRef, useState } from 'react';
import { Button } from '../../../components/ui';
import { authApi } from '../../../api';

interface DniScannerProps {
  onScanComplete: (data: any) => void;
  onManualEntry: () => void;
}

export function DniScanner({ onScanComplete, onManualEntry }: DniScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await authApi.scanDni(file);
      onScanComplete(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al leer el DNI. Asegurate de que la foto sea nítida y tenga buena iluminación.");
    } finally {
      setLoading(false);
      // Reset input para permitir volver a escanear la misma imagen si hubo un fallo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-6">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="text-center space-y-2">
        <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-dark dark:text-gray-100">Escanear documento</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Tomá una foto del <strong>frente</strong> o <strong>dorso</strong> de tu DNI (donde se vea el código de barras PDF417).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md max-w-xs text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col w-full space-y-3 pt-4">
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          loading={loading}
          disabled={loading}
          className="w-full py-3"
        >
          {loading ? "Analizando..." : "Tomar foto"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onManualEntry}
          disabled={loading}
          className="w-full"
        >
          Cargar datos manualmente
        </Button>
      </div>
    </div>
  );
}
