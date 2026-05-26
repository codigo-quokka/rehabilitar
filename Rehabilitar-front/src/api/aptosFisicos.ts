import { apiClient } from './client';
import { AptoFisico } from '../types';

export const aptosFisicosApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/aptos-fisicos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMisAptos: async (): Promise<AptoFisico[]> => {
    const response = await apiClient.get('/aptos-fisicos/mis-aptos');
    return response.data;
  },

  getPendientes: async (): Promise<AptoFisico[]> => {
    const response = await apiClient.get('/aptos-fisicos/pendientes');
    return response.data;
  },

  getArchivo: async (id: string): Promise<{ blob: Blob; contentType: string; nombreArchivo: string }> => {
    const response = await apiClient.get(`/aptos-fisicos/${id}/archivo`, {
      responseType: 'blob',
    });
    return {
      blob: response.data,
      contentType: (response.headers['content-type'] as string) || 'application/octet-stream',
      nombreArchivo: response.headers['x-filename'] || 'apto-fisico',
    };
  },

  evaluar: async (id: string, aprobado: boolean, motivoRechazo?: string) => {
    const response = await apiClient.put(`/aptos-fisicos/${id}/evaluar`, {
      aprobado,
      motivoRechazo: motivoRechazo || null,
    });
    return response.data;
  },
};
