"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  AnnouncementCard,
  type AnnouncementData,
} from "@/components/ui/announcement-card";
import { EditAnnouncementDialog } from "@/components/ui/edit-announcement-dialog";
import {
  deleteAnnouncement,
  toggleAnnouncementPin,
} from "@/lib/actions/announcement.actions";

interface HodAnnouncementsListProps {
  announcements: AnnouncementData[];
}

export function HodAnnouncementsList({
  announcements,
}: HodAnnouncementsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editAnnouncement, setEditAnnouncement] = useState<AnnouncementData | null>(null);
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
      toast.success(
        result.isPinned ? "Announcement pinned" : "Announcement unpinned"
      );
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Megaphone className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">No announcements yet</p>
          <p className="text-muted-foreground text-sm">
            Create your first announcement for your department
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement._id}
            announcement={announcement}
            canEdit
            canDelete
            canPin
            onEdit={setEditAnnouncement}
            onDelete={setDeleteId}
            onTogglePin={handleTogglePin}
            showAuthor={false}
          />
        ))}
      </div>

      <EditAnnouncementDialog
        announcement={editAnnouncement}
        open={!!editAnnouncement}
        onOpenChange={(open) => !open && setEditAnnouncement(null)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action
              cannot be undone.
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
