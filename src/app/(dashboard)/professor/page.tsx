import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getProfessorDashboardStats,
  getProfessorRecentSubmissions,
  getProfessorSubjects,
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
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Plus,
  Sparkles,
} from "lucide-react";

export default async function ProfessorDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const [dbUser, stats, recentSubmissions, subjects] = await Promise.all([
    getCurrentUserFromDB(),
    getProfessorDashboardStats(),
    getProfessorRecentSubmissions(),
    getProfessorSubjects(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const statCards = [
    {
      title: "Active ALAs",
      value: stats.activeALAs,
      icon: FileText,
      color: "blue",
    },
    {
      title: "Students",
      value: stats.studentCount,
      icon: Users,
      color: "violet",
    },
    {
      title: "Pending Review",
      value: stats.pendingSubmissions,
      icon: Clock,
      color: "amber",
      highlight: stats.pendingSubmissions > 0,
    },
    {
      title: "Graded",
      value: stats.gradedThisMonth,
      icon: CheckCircle,
      color: "emerald",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    violet: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[{ label: "Professor" }, { label: "Dashboard" }]}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back, Prof.{" "}
                {dbUser?.lastName || dbUser?.firstName || ""}
              </h2>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-muted-foreground">
              Manage your classes, ALAs, and student submissions
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/professor/alas">
              <Plus className="mr-2 h-4 w-4" />
              Create ALA
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              className={`group relative overflow-hidden transition-all hover:shadow-md ${stat.highlight ? "ring-2 ring-amber-500/20" : ""}`}
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
                  <span className="text-2xl font-bold tabular-nums">
                    {stat.value}
                  </span>
                  {stat.highlight && stat.value > 0 ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-xs text-amber-600"
                    >
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Needs attention
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Your Subjects */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <BookOpen className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <CardTitle>Your Subjects</CardTitle>
                  <CardDescription>Assigned teaching subjects</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/professor/subjects">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
              {subjects.length === 0 ? (
                <IllustratedEmpty
                  preset="noSubjects"
                  title="No subjects assigned"
                  description="Contact admin to get subjects assigned to you."
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {subjects.map(
                    (offering: {
                      _id: string;
                      subjectId: { name: string; code: string };
                      classId: { name: string };
                    }) => (
                      <Link
                        key={offering._id}
                        href={`/professor/subjects/${offering._id}`}
                        className="group/item bg-card hover:bg-accent/50 flex items-center justify-between rounded-lg border p-3 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                            <BookOpen className="h-4 w-4 text-violet-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm leading-none font-medium">
                              {offering.subjectId.code} -{" "}
                              {offering.subjectId.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {offering.classId.name}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover/item:opacity-100" />
                      </Link>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Recent Submissions
                    {stats.pendingSubmissions > 0 && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                      >
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {stats.pendingSubmissions} pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Latest student submissions</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/professor/submissions">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
              {recentSubmissions.length === 0 ? (
                <IllustratedEmpty
                  preset="noSubmissions"
                  title="No submissions yet"
                  description="Student submissions will appear here."
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {recentSubmissions.map(
                    (sub: {
                      _id: string;
                      submittedAt: string;
                      studentId: {
                        firstName: string;
                        lastName: string;
                        profileImage?: string;
                      };
                      alaId: { _id: string; title: string };
                    }) => (
                      <Link
                        key={sub._id}
                        href={`/professor/submissions/${sub._id}`}
                        className="group/item bg-card hover:bg-accent/50 flex items-center justify-between rounded-lg border p-3 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={`${sub.studentId.firstName} ${sub.studentId.lastName}`}
                            image={sub.studentId.profileImage}
                            size="sm"
                          />
                          <div className="space-y-0.5">
                            <p className="text-sm leading-none font-medium">
                              {sub.studentId.firstName} {sub.studentId.lastName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {sub.alaId.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-muted-foreground/30 tabular-nums"
                          >
                            <Clock className="mr-1.5 h-3 w-3" />
                            {formatTime(sub.submittedAt)}
                          </Badge>
                          <ArrowRight className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover/item:opacity-100" />
                        </div>
                      </Link>
                    ),
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
