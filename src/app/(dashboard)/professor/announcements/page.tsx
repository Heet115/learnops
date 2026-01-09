import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CreateProfessorAnnouncementDialog } from "@/components/professor/create-announcement-dialog";
import { ProfessorAnnouncementsPageContent } from "@/components/professor/announcements-page-content";
import {
  getMyAnnouncements,
  getAnnouncementsForUser,
} from "@/lib/actions/announcement.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { Megaphone } from "lucide-react";

export const metadata = {
  title: "Announcements | Professor | LearnOps",
  description: "Manage class announcements",
};

export default async function ProfessorAnnouncementsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const [myResult, receivedAnnouncements, dbUser] = await Promise.all([
    getMyAnnouncements(),
    getAnnouncementsForUser(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const myAnnouncements = myResult.success ? myResult.data : [];
  const error = !myResult.success ? (myResult.error ?? null) : null;

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[
        { label: "Professor", href: "/professor" },
        { label: "Announcements" },
      ]}
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
          <CreateProfessorAnnouncementDialog />
        </div>

        <ProfessorAnnouncementsPageContent
          myAnnouncements={myAnnouncements}
          receivedAnnouncements={receivedAnnouncements}
          error={error}
        />
      </div>
    </DashboardLayout>
  );
}
