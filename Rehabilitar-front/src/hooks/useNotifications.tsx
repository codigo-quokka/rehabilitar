import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Notification, BackendNotificacionDTO } from "../types";
import { Notitoast } from "../components/Notitoast";
import { notificacionesApi } from "../api";
import { useAuth } from "./useAuth";

interface PendingToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  addToTray: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

function mapBackendToNotification(dto: BackendNotificacionDTO): Notification {
  return {
    id: dto.id,
    message: dto.mensaje,
    timestamp: dto.fechaCreacion,
    read: dto.leida,
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingToast, setPendingToast] = useState<PendingToast | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificacionesApi.getMisNotificaciones();
      const mapped = response.slice(0, 7).map(mapBackendToNotification);
      setNotifications(mapped);
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setNotifications([]);
      return;
    }
    fetchNotifications();
  }, [user, authLoading, fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const dismissToast = useCallback(() => {
    setPendingToast(null);
  }, []);

  const showToast = useCallback((message: string, type?: 'success' | 'error' | 'info') => {
    setPendingToast({ id: crypto.randomUUID(), message, type: type || 'info' });
  }, []);

  const addToTray = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 7));
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await notificacionesApi.marcarComoLeida(id);
    } catch {
      console.error("Failed to mark notification as read");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(unreadIds.map((id) => notificacionesApi.marcarComoLeida(id)));
    } catch {
      console.error("Failed to mark all notifications as read");
    }
  }, [notifications]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, showToast, addToTray, markAsRead, markAllAsRead, refreshNotifications: fetchNotifications }}
    >
      {children}
      {pendingToast && createPortal(
        <Notitoast
          type={pendingToast.type}
          message={pendingToast.message}
          onClose={dismissToast}
        />,
        document.body
      )}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
