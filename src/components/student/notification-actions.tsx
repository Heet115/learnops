"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { markAllAsRead } from "@/lib/actions/notification.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAllRead}
      disabled={isPending}
    >
      <CheckCheck className="mr-2 h-4 w-4" />
      Mark all as read
    </Button>
  );
}
