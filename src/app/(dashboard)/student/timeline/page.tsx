import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getStudentSubmissionTimeline } from "@/lib/actions/activity.actions";
import { ActivityTimeline } from "@/components/activity";
import { FadeIn } from "@/components/ui/page-transition";

export default async function StudentTimelinePage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, timelineData] = await Promise.all([
    getCurrentUserFromDB(),
    getStudentSubmissionTimeline(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[
        { label: "Student" },
        { label: "Dashboard", href: "/student" },
        { label: "Timeline" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <FadeIn>
          <div>
            <h2 className="text-2xl font-bold">Submission Timeline</h2>
            <p className="text-muted-foreground">
              Track your submission history and status changes
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <ActivityTimeline
            items={timelineData}
            title="Your Activity"
            description="All your submission-related activities"
            emptyMessage="No submission activity yet. Start by submitting an ALA!"
          />
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
