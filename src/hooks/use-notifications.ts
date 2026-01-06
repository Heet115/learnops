"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

interface SSEMessage {
  type: "connected" | "notification" | "unread_count";
  payload: {
    unreadCount?: number;
    count?: number;
  } & Partial<Notification>;
}

interface UseNotificationsOptions {
  onNewNotification?: (notification: Notification) => void;
  enabled?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { onNewNotification, enabled = true } = options;
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const onNewNotificationRef = useRef(onNewNotification);
  const enabledRef = useRef(enabled);

  // Keep refs updated
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Update unread count locally (for optimistic updates)
  const decrementUnread = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n._id === id);
      if (notification && !notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n._id !== id);
    });
  }, []);

  // Connection effect
  useEffect(() => {
    if (!enabled) {
      // Cleanup without calling setState
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const connect = () => {
      if (eventSourceRef.current || !isMounted) return;

      try {
        const eventSource = new EventSource("/api/notifications/stream");
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
            reconnectAttempts.current = 0;
          }
        };

        eventSource.onmessage = (event) => {
          if (!isMounted) return;

          try {
            const data: SSEMessage = JSON.parse(event.data);

            switch (data.type) {
              case "connected":
                if (data.payload.unreadCount !== undefined) {
                  setUnreadCount(data.payload.unreadCount);
                }
                break;

              case "notification":
                const newNotification = data.payload as Notification;
                setNotifications((prev) => [newNotification, ...prev]);
                setUnreadCount((prev) => prev + 1);
                onNewNotificationRef.current?.(newNotification);
                break;

              case "unread_count":
                if (data.payload.count !== undefined) {
                  setUnreadCount(data.payload.count);
                }
                break;
            }
          } catch (e) {
            console.error("Failed to parse SSE message:", e);
          }
        };

        eventSource.onerror = () => {
          if (isMounted) {
            setIsConnected(false);
          }
          eventSource.close();
          eventSourceRef.current = null;

          // Reconnect with exponential backoff
          if (
            isMounted &&
            enabledRef.current &&
            reconnectAttempts.current < maxReconnectAttempts
          ) {
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts.current),
              30000,
            );
            reconnectAttempts.current++;

            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted && enabledRef.current) {
                connect();
              }
            }, delay);
          }
        };
      } catch (e) {
        console.error("Failed to create EventSource:", e);
      }
    };

    connect();

    return () => {
      isMounted = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled]);

  // Reconnect on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        enabledRef.current &&
        !eventSourceRef.current
      ) {
        reconnectAttempts.current = 0;
        // Close existing and let the main effect reconnect
        if (eventSourceRef.current) {
          (eventSourceRef.current as EventSource).close();
          eventSourceRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    unreadCount,
    isConnected,
    notifications,
    setNotifications,
    decrementUnread,
    clearUnread,
    addNotification,
    markAsRead,
    removeNotification,
    reconnect,
  };
}
