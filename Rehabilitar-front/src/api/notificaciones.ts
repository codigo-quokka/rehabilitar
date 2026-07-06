import { apiClient } from "./client";
import { BackendNotificacionDTO } from "../types";

export const notificacionesApi = {
  getMisNotificaciones: async (): Promise<BackendNotificacionDTO[]> => {
    const response = await apiClient.get<BackendNotificacionDTO[]>("/Notificaciones/mis-notificaciones");
    return response.data;
  },

  create: async (data: { userId: string; titulo: string; mensaje: string }): Promise<BackendNotificacionDTO> => {
    const response = await apiClient.post<BackendNotificacionDTO>("/Notificaciones", data);
    return response.data;
  },

  marcarComoLeida: async (notificacionId: string): Promise<BackendNotificacionDTO> => {
    const response = await apiClient.post<BackendNotificacionDTO>(`/Notificaciones/${notificacionId}/marcar-como-leida`);
    return response.data;
  },
};
