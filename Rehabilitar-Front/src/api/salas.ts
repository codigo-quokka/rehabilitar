import { apiClient } from './client';
import { Sala } from '../types';

export const salasApi = {
  getAll: async () => {
    const response = await apiClient.get('/salas');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/salas/${id}`);
    return response.data;
  },

  create: async (data: Omit<Sala, 'id'>) => {
    const response = await apiClient.post('/salas', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Sala>) => {
    const response = await apiClient.put(`/salas/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/salas/${id}`);
    return response.data;
  },
};