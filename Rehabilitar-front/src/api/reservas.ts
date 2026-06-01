import { apiClient } from './client';
import { Reserva, TipoCliente } from '../types';

export const reservasApi = {
  getAll: async (params?: { usuarioId?: string; actividadId?: string; estado?: string }) => {
    const response = await apiClient.get('/reservas', { params });
    return response.data as Reserva[];
  },

  getMisReservas: async () => {
    const response = await apiClient.get('/reservas/mis-reservas');
    return response.data as Reserva[];
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/reservas/${id}`);
    return response.data as Reserva;
  },

  create: async (data: { actividadId: string; clienteId: string; tipoCliente: string }) => {
    const response = await apiClient.post('/reservas', data);
    return response.data as Reserva & { intencionId: string };
  },

  cancelar: async (reservaId: string, actividadId: string) => {
    const response = await apiClient.put(`/reservas/${reservaId}/cancelar`, null, { params: { actividadId } });
    return response.data;
  },

  registrarPago: async (reservaId: string, data: { actividadId: string; metodoPago: string; monto: number }) => {
    const response = await apiClient.post(`/reservas/${reservaId}/pago`, data);
    return response.data;
  },

  createRecurrente: async (data: { clienteId: string; actividadesIds: string[] }) => {
    const response = await apiClient.post('/reservas/recurrente', data);
    return response.data; // Should return { intencionId: string }
  },

  eliminarIntencion: async (intencionId: string) => {
    const response = await apiClient.delete(`/pagos/intencion/${intencionId}`);
    return response.data;
  },
};
