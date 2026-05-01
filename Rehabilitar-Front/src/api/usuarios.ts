import { apiClient } from './client';
import { User } from '../types';

interface CreateUserData {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  documento?: string;
  rol?: string;
  password?: string;
}

export const usuariosApi = {
  getAll: async (params?: { page?: number; pageSize?: number; rol?: string }) => {
    const response = await apiClient.get('/usuarios', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/usuarios/${id}`);
    return response.data;
  },

  create: async (data: CreateUserData) => {
    const response = await apiClient.post('/usuarios', data);
    return response.data;
  },

  update: async (id: string, data: Partial<User>) => {
    const response = await apiClient.put(`/usuarios/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/usuarios/${id}`);
    return response.data;
  },

  confirmarAptitud: async (id: string, aptitud: boolean) => {
    const response = await apiClient.post(`/usuarios/${id}/aptitud`, { aptitud });
    return response.data;
  },
};