import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AnnouncementsList } from "@/components/admin/announcements-list";
import { CreateAnnouncementDialog } from "@/components/admin/create-announcement-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAllAnnouncements } from "@/lib/actions/announcement.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { Megaphone, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Announcements | Admin | LearnOps",
  description: "Manage system announcements",
};

export default async function AdminAnnouncementsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [result, dbUser] = await Promise.all([
    getAllAnnouncements(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Admin"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const announcements = result.success ? result.data : [];
  const error = !result.success ? result.error : null;

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Announcements" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Megaphone className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Announcements
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Create and manage system-wide announcements
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{announcements.length} total</Badge>
            <CreateAnnouncementDialog />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Suspense fallback={<AnnouncementsSkeleton />}>
          <AnnouncementsList announcements={announcements} />
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
