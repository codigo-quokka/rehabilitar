import { apiClient } from './client';
import { Metricas } from '../types';

export const metricasApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/metricas/dashboard');
    return response.data;
  },

  getResumen: async (params?: { fechaInicio?: string; fechaFin?: string }) => {
    const response = await apiClient.get('/metricas/resumen', { params });
    return response.data;
  },

  getOcupacionSalas: async () => {
    const response = await apiClient.get('/metricas/ocupacion-salas');
    return response.data;
  },

  getIngresosPorPeriodo: async (params?: { fechaInicio: string; fechaFin: string }) => {
    const response = await apiClient.get('/metricas/ingresos', { params });
    return response.data;
  },
};