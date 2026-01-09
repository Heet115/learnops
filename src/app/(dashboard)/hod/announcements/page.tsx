import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CreateHodAnnouncementDialog } from "@/components/hod/create-announcement-dialog";
import { AnnouncementsPageContent } from "@/components/hod/announcements-page-content";
import {
  getMyAnnouncements,
  getAnnouncementsForUser,
} from "@/lib/actions/announcement.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { Megaphone } from "lucide-react";

export const metadata = {
  title: "Announcements | HOD | LearnOps",
  description: "Manage department announcements",
};

export default async function HodAnnouncementsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "hod") {
    redirect("/unauthorized");
  }

  const [myResult, receivedAnnouncements, dbUser] = await Promise.all([
    getMyAnnouncements(),
    getAnnouncementsForUser(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "HOD"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const myAnnouncements = myResult.success ? myResult.data : [];
  const error = !myResult.success ? (myResult.error ?? null) : null;

  return (
    <DashboardLayout
      role="hod"
      user={user}
      breadcrumbs={[{ label: "HOD", href: "/hod" }, { label: "Announcements" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Megaphone className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Announcements
              </h1>
              <p className="text-muted-foreground">
                View and create announcements
              </p>
            </div>
          </div>
          <CreateHodAnnouncementDialog />
        </div>

        <AnnouncementsPageContent
          myAnnouncements={myAnnouncements}
          receivedAnnouncements={receivedAnnouncements}
          error={error}
        />
      </div>
    </DashboardLayout>
  );
}
