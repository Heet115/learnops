import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getStudentDashboardStats,
  getStudentUpcomingDeadlines,
  getStudentRecentGrades,
} from "@/lib/actions/dashboard.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
} from "lucide-react";

export default async function StudentDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, stats, upcomingDeadlines, recentGrades] = await Promise.all([
    getCurrentUserFromDB(),
    getStudentDashboardStats(),
    getStudentUpcomingDeadlines(),
    getStudentRecentGrades(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const statCards = [
    {
      title: "Pending ALAs",
      value: stats.pending,
      icon: FileText,
      description: "To submit",
      color: "text-blue-600",
    },
    {
      title: "Due Soon",
      value: stats.dueSoon,
      icon: Clock,
      description: "Within 3 days",
      color: "text-orange-600",
    },
    {
      title: "Submitted",
      value: stats.submitted,
      icon: CheckCircle,
      description: "This semester",
      color: "text-green-600",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      description: "Missed deadline",
      color: "text-red-600",
    },
  ];

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (days <= 3) return `${days} days left`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[{ label: "Student" }, { label: "Dashboard" }]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, {dbUser?.firstName || "Student"}
          </h2>
          <p className="text-muted-foreground">
            Track your assignments and submissions
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>ALAs due soon</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/alas">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No upcoming deadlines
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map(
                    (ala: {
                      _id: string;
                      title: string;
                      deadline: string;
                      subjectOfferingId?: {
                        subjectId?: { code: string };
                      };
                    }) => {
                      const deadline = formatDeadline(ala.deadline);
                      const isUrgent =
                        deadline.includes("today") ||
                        deadline.includes("tomorrow") ||
                        deadline.includes("days left");
                      return (
                        <Link
                          key={ala._id}
                          href={`/student/alas/${ala._id}`}
                          className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="text-muted-foreground h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">{ala.title}</p>
                              <p className="text-muted-foreground text-xs">
                                {ala.subjectOfferingId?.subjectId?.code || ""}
                              </p>
                            </div>
                          </div>
                          <Badge variant={isUrgent ? "destructive" : "outline"}>
                            <Calendar className="mr-1 h-3 w-3" />
                            {deadline}
                          </Badge>
                        </Link>
                      );
                    },
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Grades</CardTitle>
                <CardDescription>Your latest results</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/submissions">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentGrades.length === 0 ? (
                <p className="text-muted-foreground text-sm">No grades yet</p>
              ) : (
                <div className="space-y-3">
                  {recentGrades.map(
                    (sub: {
                      _id: string;
                      marks: number;
                      alaId: {
                        _id: string;
                        title: string;
                        maxMarks: number;
                        subjectOfferingId?: {
                          subjectId?: { code: string };
                        };
                      };
                    }) => {
                      const percentage = Math.round(
                        (sub.marks / sub.alaId.maxMarks) * 100,
                      );
                      return (
                        <Link
                          key={sub._id}
                          href={`/student/alas/${sub.alaId._id}`}
                          className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">
                                {sub.alaId.title}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {sub.alaId.subjectOfferingId?.subjectId?.code ||
                                  ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">
                              {sub.marks}/{sub.alaId.maxMarks}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {percentage}%
                            </p>
                          </div>
                        </Link>
                      );
                    },
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
