import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getStudentSubmissionTimeline } from "@/lib/actions/activity.actions";
import { ActivityTimeline } from "@/components/activity";
import { FadeIn } from "@/components/ui/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <History className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Submission Timeline</h2>
              <p className="text-muted-foreground">
                Track your submission history and status changes
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <History className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle>Your Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ActivityTimeline
                items={timelineData}
                emptyMessage="No submission activity yet. Start by submitting an ALA!"
              />
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
