import { useCallback } from "react";
import { useAuth } from "./useAuth";
import { useNotifications } from "./useNotifications";
import { notificacionesApi } from "../api";

interface ImportantNotificationParams {
  message: string;
  type?: "success" | "error" | "info";
  onSuccess?: () => void;
}

export function useImportantNotification() {
  const { user } = useAuth();
  const { showToast, addToTray } = useNotifications();

  const notify = useCallback(
    async (params: ImportantNotificationParams) => {
      showToast(params.message, params.type || "info");

      if (!user) {
        console.error("Cannot save notification: no authenticated user");
        params.onSuccess?.();
        return;
      }

      if (user.notificacionAplicacion !== false) {
        try {
          const response = await notificacionesApi.create({
            userId: user.id,
            titulo: "Notificación",
            mensaje: params.message,
          });
          addToTray({
            id: response.id,
            message: response.mensaje,
            timestamp: response.fechaCreacion,
            read: response.leida,
          });
        } catch (error) {
          console.error("Failed to save notification:", error);
        }
      }

      params.onSuccess?.();
    },
    [user, showToast, addToTray]
  );

  return notify;
}
