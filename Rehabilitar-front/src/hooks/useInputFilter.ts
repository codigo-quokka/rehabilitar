import { KeyboardEvent, ClipboardEvent } from "react";

// Definimos la estructura de la configuración del filtro
interface FilterConfig {
  allowedKeyRegex: RegExp;
  cleanPasteRegex: RegExp;
  maxLength?: number;
}

export const useInputFilter = (
  value: string,
  onChange: (newValue: string) => void,
  config: FilterConfig
) => {
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Permitir combinaciones de teclas (Ctrl+C, Cmd+V, etc.)
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    // Permitir teclas especiales de control (Backspace, Enter, ArrowLeft, etc.)
    if (e.key.length > 1) return;

    // 1. Validar caracteres permitidos
    if (!config.allowedKeyRegex.test(e.key)) {
      e.preventDefault();
      return;
    }

    // 2. Validar longitud máxima (si existe)
    if (config.maxLength) {
      const input = e.currentTarget;
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const willReplace = end - start;
      
      if (value.length - willReplace >= config.maxLength) {
        e.preventDefault();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    // Limpiar el texto del portapapeles con la regex correspondiente
    const text = e.clipboardData.getData("text");
    const cleaned = text.replace(config.cleanPasteRegex, "");
    if (!cleaned) return;

    const input = e.currentTarget;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;

    // Calcular cuánto texto podemos insertar si hay un maxLength
    let toInsert = cleaned;
    if (config.maxLength) {
      const availableSpace = Math.max(0, config.maxLength - (value.length - (end - start)));
      toInsert = cleaned.slice(0, availableSpace);
    }

    // Construir el nuevo valor final
    const newValue = value.slice(0, start) + toInsert + value.slice(end);
    
    // Devolver el valor procesado al componente padre
    onChange(newValue);
  };

  return { handleKeyDown, handlePaste };
};