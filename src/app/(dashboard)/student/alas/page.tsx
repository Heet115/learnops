import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getStudentALAs } from "@/lib/actions/submission.actions";
import { StudentALAsList } from "@/components/student/student-alas-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default async function StudentALAsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, alas] = await Promise.all([
    getCurrentUserFromDB(),
    getStudentALAs(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const now = new Date();
  const pending = alas.filter(
    (a: { submission: unknown; deadline: string; isLocked: boolean }) =>
      !a.submission && new Date(a.deadline) > now && !a.isLocked,
  ).length;
  const submitted = alas.filter(
    (a: { submission?: { status: string } }) =>
      a.submission?.status === "submitted" || a.submission?.status === "graded",
  ).length;
  const overdue = alas.filter(
    (a: { submission: unknown; deadline: string }) =>
      !a.submission && new Date(a.deadline) < now,
  ).length;
  const dueSoon = alas.filter(
    (a: { submission: unknown; deadline: string; isLocked: boolean }) => {
      if (a.submission || a.isLocked) return false;
      const deadline = new Date(a.deadline);
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return deadline > now && deadline <= threeDays;
    },
  ).length;

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[
        { label: "Student", href: "/student" },
        { label: "My ALAs" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">My ALAs</h2>
          <p className="text-muted-foreground">
            View and submit your assignments
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <FileText className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dueSoon}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {submitted}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdue}</div>
            </CardContent>
          </Card>
        </div>

        <StudentALAsList alas={alas} />
      </div>
    </DashboardLayout>
  );
}
