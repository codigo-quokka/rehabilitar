import { apiClient } from './client';
import { Actividad } from '../types';

export const profesorApi = {
  getMisClases: async (profesorId: string): Promise<Actividad[]> => {
    const response = await apiClient.get(`/profesores/${profesorId}/clases`);
    return response.data;
  },
};
