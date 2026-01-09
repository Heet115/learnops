"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pin, Trash2, MoreHorizontal, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  deleteAnnouncement,
  toggleAnnouncementPin,
} from "@/lib/actions/announcement.actions";
import type { IAnnouncement } from "@/lib/db";

interface AnnouncementsListProps {
  announcements: IAnnouncement[];
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const result = await deleteAnnouncement(deleteId);
    setLoading(false);
    setDeleteId(null);
    
    if (result.success) {
      toast.success("Announcement deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const handleTogglePin = async (id: string) => {
    const result = await toggleAnnouncementPin(id);
    if (result.success) {
      toast.success(result.isPinned ? "Announcement pinned" : "Announcement unpinned");
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "normal":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTargetLabel = (target: IAnnouncement["target"]) => {
    switch (target.type) {
      case "all":
        return "All Users";
      case "role":
        return `All ${target.role}s`;
      case "department":
        return "Department";
      case "course":
        return "Course";
      case "class":
        return "Class";
      default:
        return target.type;
    }
  };

  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No announcements yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first announcement to broadcast to users
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card
            key={announcement._id.toString()}
            className={cn(
              "relative",
              !announcement.isActive && "opacity-60"
            )}
          >
            {announcement.isPinned && (
              <div className="absolute top-2 right-2">
                <Pin className="h-4 w-4 text-primary fill-primary" />
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                    <Badge variant="outline">{getTargetLabel(announcement.target)}</Badge>
                    {!announcement.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{announcement.title}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleTogglePin(announcement._id.toString())}
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {announcement.isPinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(announcement._id.toString())}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
                {announcement.content}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  By {(announcement.createdBy as unknown as { firstName: string; lastName: string })?.firstName}{" "}
                  {(announcement.createdBy as unknown as { firstName: string; lastName: string })?.lastName}
                </span>
                <div className="flex items-center gap-4">
                  {announcement.expiresAt && (
                    <span>
                      Expires: {format(new Date(announcement.expiresAt), "MMM d, yyyy")}
                    </span>
                  )}
                  <span>
                    {format(new Date(announcement.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
