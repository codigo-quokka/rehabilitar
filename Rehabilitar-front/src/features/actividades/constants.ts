export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

export const tipoLabel: Record<string, string> = {
  TrenSuperior: 'Tren Superior',
  TrenMedio: 'Tren Medio',
  TrenInferior: 'Tren Inferior',
};

export const frecuenciaLabel: Record<string, string> = {
  Esporadica: 'Esporádica',
  Recurrente: 'Recurrente',
};

export const estadoLabel: Record<string, string> = {
  Propuesta: 'Propuesta',
  Aprobada: 'Aprobada',
  EnCurso: 'En Curso',
  Cancelada: 'Cancelada',
};
