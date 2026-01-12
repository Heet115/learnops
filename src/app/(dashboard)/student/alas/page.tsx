import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getStudentALAs } from "@/lib/actions/submission.actions";
import { getStudentPendingInvites } from "@/lib/actions/group.actions";
import { StudentALAsList } from "@/components/student/student-alas-list";
import { GroupInvitations } from "@/components/student/group-invitations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

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

  // Helper to check if ALA is in late submission window
  const isInLateWindow = (ala: {
    deadline: string;
    allowLateSubmission?: boolean;
    lateDeadline?: string;
  }) => {
    const deadline = new Date(ala.deadline);
    const lateDeadline = ala.lateDeadline ? new Date(ala.lateDeadline) : null;
    return (
      ala.allowLateSubmission &&
      lateDeadline &&
      deadline < now &&
      lateDeadline > now
    );
  };

  // Helper to check if ALA can still be submitted (including late window)
  const canStillSubmit = (ala: {
    deadline: string;
    isLocked: boolean;
    allowLateSubmission?: boolean;
    lateDeadline?: string;
  }) => {
    if (ala.isLocked) return false;
    const deadline = new Date(ala.deadline);
    if (deadline > now) return true;
    return isInLateWindow(ala);
  };

  const pending = alas.filter(
    (a: {
      submission: unknown;
      deadline: string;
      isLocked: boolean;
      allowLateSubmission?: boolean;
      lateDeadline?: string;
    }) => !a.submission && canStillSubmit(a),
  ).length;
  const submitted = alas.filter(
    (a: { submission?: { status: string } }) =>
      a.submission?.status === "submitted" || a.submission?.status === "graded",
  ).length;
  const overdue = alas.filter(
    (a: {
      submission: unknown;
      deadline: string;
      allowLateSubmission?: boolean;
      lateDeadline?: string;
      isLocked: boolean;
    }) => {
      if (a.submission) return false;
      // Not overdue if still in late window
      if (isInLateWindow(a)) return false;
      const deadline = new Date(a.deadline);
      const lateDeadline = a.lateDeadline ? new Date(a.lateDeadline) : null;
      // Overdue if past deadline (and past late deadline if applicable)
      if (a.allowLateSubmission && lateDeadline) {
        return lateDeadline < now;
      }
      return deadline < now;
    },
  ).length;
  const dueSoon = alas.filter(
    (a: {
      submission: unknown;
      deadline: string;
      isLocked: boolean;
      allowLateSubmission?: boolean;
      lateDeadline?: string;
    }) => {
      if (a.submission || a.isLocked) return false;
      const deadline = new Date(a.deadline);
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      // Due soon if main deadline is within 3 days
      if (deadline > now && deadline <= threeDays) return true;
      // Also due soon if in late window and late deadline is within 3 days
      if (isInLateWindow(a)) {
        const lateDeadline = new Date(a.lateDeadline!);
        return lateDeadline <= threeDays;
      }
      return false;
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">My ALAs</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {alas.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              View and submit your assignments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[stat.color]}`}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <GroupInvitations invitations={pendingInvites} />

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <FileText className="text-primary h-4 w-4" />
              </div>
              <div>
                <CardTitle>All ALAs</CardTitle>
                <CardDescription>
                  View your assignments and submit work
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StudentALAsList alas={alas} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
