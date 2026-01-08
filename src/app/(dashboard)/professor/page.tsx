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
import { Separator } from "@/components/ui/separator";
import { FadeIn, SlideUp } from "@/components/ui/page-transition";
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
  TrendingUp,
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
      description: "Currently active",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "group-hover:border-blue-500/30",
    },
    {
      title: "Students",
      value: stats.studentCount,
      icon: Users,
      description: "In your classes",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "group-hover:border-purple-500/30",
    },
    {
      title: "Pending Review",
      value: stats.pendingSubmissions,
      icon: Clock,
      description: "Awaiting grading",
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "group-hover:border-orange-500/30",
      highlight: stats.pendingSubmissions > 0,
    },
    {
      title: "Graded",
      value: stats.gradedThisMonth,
      icon: CheckCircle,
      description: "Total graded",
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "group-hover:border-emerald-500/30",
    },
  ];

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
      <div className="space-y-6 pt-4">
        {/* Welcome Section */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome back, Prof. {dbUser?.lastName || dbUser?.firstName || ""}
                </h2>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-muted-foreground">
                Manage your classes, ALAs, and student submissions
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/professor/alas/new">
                <Plus className="mr-2 h-4 w-4" />
                Create ALA
              </Link>
            </Button>
          </div>
        </FadeIn>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <SlideUp key={stat.title} delay={index * 75}>
              <Card className={`group transition-all duration-300 hover:shadow-md ${stat.borderColor} ${stat.highlight ? "ring-2 ring-orange-500/20" : ""}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">
                      {stat.value}
                    </span>
                    {stat.highlight && stat.value > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        Needs attention
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-xs font-normal">
                        <TrendingUp className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </SlideUp>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Your Subjects */}
          <FadeIn delay={300}>
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Your Subjects
                  </CardTitle>
                  <CardDescription>Assigned teaching subjects</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/professor/subjects">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <Separator />
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
                          className="group/item flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:bg-accent/50 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                              <BookOpen className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">
                                {offering.subjectId.code} - {offering.subjectId.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {offering.classId.name}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100" />
                        </Link>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          {/* Recent Submissions */}
          <FadeIn delay={375}>
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Recent Submissions
                    {stats.pendingSubmissions > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {stats.pendingSubmissions} pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Latest student submissions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/professor/submissions">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <Separator />
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
                        studentId: { firstName: string; lastName: string; profileImage?: string };
                        alaId: { _id: string; title: string };
                      }) => (
                        <Link
                          key={sub._id}
                          href={`/professor/submissions/${sub._id}`}
                          className="group/item flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:bg-accent/50 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={`${sub.studentId.firstName} ${sub.studentId.lastName}`}
                              image={sub.studentId.profileImage}
                              size="sm"
                            />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">
                                {sub.studentId.firstName} {sub.studentId.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {sub.alaId.title}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="tabular-nums">
                              {formatTime(sub.submittedAt)}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100" />
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </DashboardLayout>
  );
}
