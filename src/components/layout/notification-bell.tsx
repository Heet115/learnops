"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  Clock,
  Award,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/actions/notification.actions";
import Link from "next/link";

interface Notification {
  _id: string;
  type:
    | "new_ala"
    | "deadline_reminder"
    | "submission_graded"
    | "submission_rejected"
    | "system";
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: "ala" | "submission";
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  role: "admin" | "hod" | "professor" | "student";
}

export function NotificationBell({ role }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = async () => {
    const [notifs, count] = await Promise.all([
      getNotifications(20),
      getUnreadCount(),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteNotification(id);
      const wasUnread = notifications.find((n) => n._id === id && !n.isRead);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "new_ala":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "deadline_reminder":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "submission_graded":
        return <Award className="h-4 w-4 text-green-500" />;
      case "submission_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLink = (notification: Notification) => {
    if (!notification.relatedId) return null;

    if (notification.relatedType === "ala") {
      return role === "student"
        ? `/student/alas/${notification.relatedId}`
        : `/professor/alas/${notification.relatedId}`;
    }
    if (notification.relatedType === "submission") {
      return role === "student"
        ? `/student/submissions`
        : `/professor/submissions/${notification.relatedId}`;
    }
    return null;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="text-muted-foreground mb-2 h-10 w-10" />
              <p className="text-muted-foreground text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const link = getLink(notification);
                const content = (
                  <div
                    className={cn(
                      "hover:bg-muted/50 flex gap-3 p-3 transition-colors",
                      !notification.isRead && "bg-muted/30",
                    )}
                  >
                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          !notification.isRead && "font-medium",
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {notification.message}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          disabled={isPending}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-6 w-6"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );

                return link ? (
                  <Link
                    key={notification._id}
                    href={link}
                    onClick={() => {
                      if (!notification.isRead)
                        handleMarkAsRead(notification._id);
                      setIsOpen(false);
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={notification._id}>{content}</div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
