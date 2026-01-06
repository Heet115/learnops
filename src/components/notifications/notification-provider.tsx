"use client";

import { createContext, useContext, ReactNode } from "react";
import { useNotifications } from "@/hooks/use-notifications";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextValue {
  unreadCount: number;
  isConnected: boolean;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  decrementUnread: () => void;
  clearUnread: () => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  reconnect: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

interface NotificationProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function NotificationProvider({
  children,
  enabled = true,
}: NotificationProviderProps) {
  const notificationState = useNotifications({ enabled });

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider",
    );
  }
  return context;
}
