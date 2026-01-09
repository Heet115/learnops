import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StudentAnnouncementsList } from "@/components/student/announcements-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getAnnouncementsForUser } from "@/lib/actions/announcement.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { Megaphone } from "lucide-react";

export const metadata = {
  title: "Announcements | Student | LearnOps",
  description: "View announcements from your professors and administration",
};

export default async function StudentAnnouncementsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [announcements, dbUser] = await Promise.all([
    getAnnouncementsForUser(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const pinnedCount = announcements.filter((a: { isPinned: boolean }) => a.isPinned).length;
  const urgentCount = announcements.filter((a: { priority: string }) => a.priority === "urgent").length;

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[{ label: "Student", href: "/student" }, { label: "Announcements" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Megaphone className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
              <p className="text-muted-foreground">
                Stay updated with important messages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {urgentCount > 0 && (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">
                {urgentCount} urgent
              </Badge>
            )}
            {pinnedCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                {pinnedCount} pinned
              </Badge>
            )}
            <Badge variant="secondary">{announcements.length} total</Badge>
          </div>
        </div>

        <Suspense fallback={<AnnouncementsSkeleton />}>
          <StudentAnnouncementsList announcements={announcements} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-lg" />
      ))}
    </div>
  );
}
