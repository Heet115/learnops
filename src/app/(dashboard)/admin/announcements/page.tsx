import { Suspense } from "react";
import { AnnouncementsList } from "@/components/admin/announcements-list";
import { CreateAnnouncementDialog } from "@/components/admin/create-announcement-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllAnnouncements } from "@/lib/actions/announcement.actions";

export const metadata = {
  title: "Announcements | Admin | LearnOps",
  description: "Manage system announcements",
};

export default async function AdminAnnouncementsPage() {
  const announcements = await getAllAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Create and manage system-wide announcements
          </p>
        </div>
        <CreateAnnouncementDialog />
      </div>

      <Suspense fallback={<AnnouncementsSkeleton />}>
        <AnnouncementsList announcements={announcements} />
      </Suspense>
    </div>
  );
}

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-lg" />
      ))}
    </div>
  );
}
