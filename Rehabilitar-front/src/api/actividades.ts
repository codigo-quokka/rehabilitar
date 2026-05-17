import { apiClient } from './client';
import { Actividad, CreateActividadRequest, CreateActividadRecurrenteRequest } from '../types';

export const actividadesApi = {
  getAll: async (params?: { fecha?: string; categoria?: string; profesorId?: string }) => {
    const response = await apiClient.get('/actividades', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/actividades/${id}`);
    return response.data;
  },

  create: async (data: CreateActividadRequest) => {
    const response = await apiClient.post('/actividades', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Actividad>) => {
    const response = await apiClient.put(`/actividades/${id}`, data);
    return response.data;
  },

  createRecurrente: async (data: CreateActividadRecurrenteRequest) => {
    const response = await apiClient.post('/actividades/recurrente', data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/actividades/${id}`);
    return response.data;
  },

  getByProfesor: async (profesorId: string) => {
    const response = await apiClient.get('/actividades/profesor', { params: { profesorId } });
    return response.data;
  },

  asignarProfesor: async (id: string, profesorId: string) => {
    const response = await apiClient.put(`/actividades/${id}/asignar-profesor`, { profesorId });
    return response.data;
  },

  removerProfesor: async (id: string, profesorId: string) => {
    const response = await apiClient.put(`/actividades/${id}/remover-profesor`, { profesorId });
    return response.data;
  },
};