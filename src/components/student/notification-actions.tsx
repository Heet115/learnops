"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCheck, Trash2 } from "lucide-react";
import {
  markAllAsRead,
  deleteAllRead,
} from "@/lib/actions/notification.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export function NotificationActions() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllAsRead();
      if (result.success) {
        toast.success("All notifications marked as read");
        router.refresh();
      }
    });
  };

  const handleClearRead = () => {
    startTransition(async () => {
      const result = await deleteAllRead();
      if (result.success) {
        toast.success(`Cleared ${result.count || 0} read notifications`);
        router.refresh();
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleMarkAllRead} disabled={isPending}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleClearRead}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear read notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
