import { apiClient } from './client';

interface CreateUserData {
  nombre: string;
  apellido: string;
  email: string;
  rol?: string;
  especialidad?: string;
}

interface UpdateUserData {
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
  especialidad?: string;
}

export const usuariosApi = {
  getAll: async () => {
    const response = await apiClient.get('/usuarios');
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

  update: async (id: string, data: UpdateUserData) => {
    const response = await apiClient.put(`/usuarios/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/usuarios/${id}`);
    return response.data;
  },

  suspender: async (id: string) => {
    const response = await apiClient.put(`/usuarios/${id}/suspender`);
    return response.data;
  },

  reactivar: async (id: string) => {
    const response = await apiClient.put(`/usuarios/${id}/reactivar`);
    return response.data;
  },
};
