import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Notification } from "../types";
import { Notitoast } from "../components/Notitoast";

interface PendingToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

function createInitialNotifications(): Notification[] {
  const now = new Date().toISOString();
  return [
    {
      id: "1",
      message: "Bienvenido a RehabilitAR",
      timestamp: now,
      read: false,
    }
  ];
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(createInitialNotifications);
  const [pendingToast, setPendingToast] = useState<PendingToast | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const dismissToast = useCallback(() => {
    setPendingToast((current) => {
      if (!current) return null;
      const newNotification: Notification = {
        id: current.id,
        message: current.message,
        timestamp: new Date().toISOString(),
        read: false,
        type: current.type,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      return null;
    });
  }, []);

  const addNotification = useCallback((message: string, type?: 'success' | 'error' | 'info') => {
    setPendingToast((current) => {
      if (current) {
        const dismissedNotification: Notification = {
          id: current.id,
          message: current.message,
          timestamp: new Date().toISOString(),
          read: false,
          type: current.type,
        };
        setNotifications((prev) => [dismissedNotification, ...prev]);
      }
      return {
        id: crypto.randomUUID(),
        message,
        type: type || 'info',
      };
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}
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
