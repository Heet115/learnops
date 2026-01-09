import { Suspense } from "react";
import { HodAnnouncementsList } from "@/components/hod/announcements-list";
import { CreateHodAnnouncementDialog } from "@/components/hod/create-announcement-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyAnnouncements } from "@/lib/actions/announcement.actions";

export const metadata = {
  title: "Announcements | HOD | LearnOps",
  description: "Manage department announcements",
};

export default async function HodAnnouncementsPage() {
  const announcements = await getMyAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Create announcements for your department
          </p>
        </div>
        <CreateHodAnnouncementDialog />
      </div>

      <Suspense fallback={<AnnouncementsSkeleton />}>
        <HodAnnouncementsList announcements={announcements} />
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
