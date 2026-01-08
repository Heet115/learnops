import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getStudentALAs } from "@/lib/actions/submission.actions";
import { getStudentPendingInvites } from "@/lib/actions/group.actions";
import { StudentALAsList } from "@/components/student/student-alas-list";
import { GroupInvitations } from "@/components/student/group-invitations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export default async function StudentALAsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, alas, pendingInvites] = await Promise.all([
    getCurrentUserFromDB(),
    getStudentALAs(),
    getStudentPendingInvites(),
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

  const statCards = [
    {
      title: "Pending",
      value: pending,
      icon: FileText,
      color: "blue",
    },
    {
      title: "Due Soon",
      value: dueSoon,
      icon: Clock,
      color: "amber",
    },
    {
      title: "Submitted",
      value: submitted,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      title: "Overdue",
      value: overdue,
      icon: AlertCircle,
      color: "rose",
    },
  ];

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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">My ALAs</h2>
              <Badge variant="secondary" className="text-sm">
                {alas.length} Total
              </Badge>
            </div>
            <p className="text-muted-foreground">
              View and submit your assignments
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              className="group relative overflow-hidden transition-all hover:shadow-md"
            >
              <div
                className={`absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full ${colorMap[stat.color].split(" ")[0]} opacity-50 transition-transform group-hover:scale-150`}
              />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${colorMap[stat.color]}`}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <GroupInvitations invitations={pendingInvites} />

        <StudentALAsList alas={alas} />
      </div>
    </DashboardLayout>
  );
}
