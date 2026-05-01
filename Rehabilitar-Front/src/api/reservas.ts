import { apiClient } from './client';
import { Reserva } from '../types';

export const reservasApi = {
  getAll: async (params?: { usuarioId?: string; actividadId?: string; estado?: string }) => {
    const response = await apiClient.get('/reservas', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/reservas/${id}`);
    return response.data;
  },

  create: async (data: { actividadId: string; metodoPago?: string; observaciones?: string }) => {
    const response = await apiClient.post('/reservas', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Reserva>) => {
    const response = await apiClient.put(`/reservas/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/reservas/${id}`);
    return response.data;
  },

  confirmarAsistencia: async (id: string, asistio: boolean) => {
    const response = await apiClient.post(`/reservas/${id}/asistencia`, { asistio });
    return response.data;
  },

  registrarPago: async (id: string, metodoPago: string, monto: number) => {
    const response = await apiClient.post(`/reservas/${id}/pago`, { metodoPago, monto });
    return response.data;
  },
};