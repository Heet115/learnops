"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  Clock,
  Award,
  XCircle,
  Settings,
  Wifi,
  WifiOff,
  Users,
  UserPlus,
  UserMinus,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/actions/notification.actions";
import { useNotifications } from "@/hooks/use-notifications";
import Link from "next/link";
import { toast } from "sonner";

type NotificationType =
  | "new_ala"
  | "deadline_reminder"
  | "submission_graded"
  | "submission_rejected"
  | "group_invite"
  | "group_joined"
  | "group_left"
  | "announcement"
  | "system";

interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: "ala" | "submission" | "group" | "announcement";
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  role: "admin" | "hod" | "professor" | "student";
}

export function NotificationBell({ role }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Real-time notifications hook
  const {
    unreadCount,
    isConnected,
    notifications,
    setNotifications,
    decrementUnread,
    clearUnread,
    markAsRead: markAsReadLocal,
    removeNotification,
  } = useNotifications({
    enabled: true,
    onNewNotification: (notification) => {
      // Show toast for new notifications
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    },
  });

  // Load initial notifications
  useEffect(() => {
    if (!initialLoaded) {
      getNotifications(20).then((result) => {
        // Extract notifications array from result
        const typedNotifs = result.notifications as Notification[];
        setNotifications(typedNotifs);
        setInitialLoaded(true);
      });
    }
  }, [initialLoaded, setNotifications]);

  const handleMarkAsRead = useCallback(
    (id: string) => {
      // Optimistic update
      markAsReadLocal(id);
      decrementUnread();

      startTransition(async () => {
        await markAsRead(id);
      });
    },
    [markAsReadLocal, decrementUnread],
  );

  const handleMarkAllAsRead = useCallback(() => {
    // Optimistic update - cast notifications to proper type
    setNotifications((prev) =>
      (prev as Notification[]).map((n) => ({ ...n, isRead: true })),
    );
    clearUnread();

    startTransition(async () => {
      await markAllAsRead();
    });
  }, [setNotifications, clearUnread]);

  const handleDelete = useCallback(
    (id: string) => {
      // Optimistic update
      removeNotification(id);

      startTransition(async () => {
        await deleteNotification(id);
      });
    },
    [removeNotification],
  );

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
      case "group_invite":
        return <UserPlus className="h-4 w-4 text-violet-500" />;
      case "group_joined":
        return <Users className="h-4 w-4 text-emerald-500" />;
      case "group_left":
        return <UserMinus className="h-4 w-4 text-amber-500" />;
      case "announcement":
        return <Megaphone className="h-4 w-4 text-indigo-500" />;
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
    if (notification.relatedType === "group") {
      // Group notifications link to the ALA page where the group is
      return role === "student" ? `/student/alas` : null;
    }
    if (notification.relatedType === "announcement") {
      return role === "student" ? `/student/announcements` : null;
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

  const settingsLink =
    role === "student"
      ? "/student/notifications/settings"
      : role === "professor"
        ? "/professor/notifications/settings"
        : null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Notifications</h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  {isConnected ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="text-muted-foreground h-3 w-3" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isConnected ? "Real-time updates active" : "Reconnecting..."}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1">
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
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="text-muted-foreground mb-2 h-10 w-10" />
              <p className="text-muted-foreground text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {(notifications as Notification[]).map((notification) => {
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
        {settingsLink && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href={settingsLink} onClick={() => setIsOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Notification Settings
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
