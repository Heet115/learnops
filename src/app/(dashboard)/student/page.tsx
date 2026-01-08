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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FadeIn, SlideUp } from "@/components/ui/page-transition";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  Sparkles,
  Trophy,
  Target,
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
      bgColor: "bg-blue-500/10",
      borderColor: "group-hover:border-blue-500/30",
    },
    {
      title: "Due Soon",
      value: stats.dueSoon,
      icon: Clock,
      description: "Within 3 days",
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "group-hover:border-orange-500/30",
      highlight: stats.dueSoon > 0,
    },
    {
      title: "Submitted",
      value: stats.submitted,
      icon: CheckCircle,
      description: "This semester",
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "group-hover:border-emerald-500/30",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      description: "Missed deadline",
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      borderColor: "group-hover:border-red-500/30",
      highlight: stats.overdue > 0,
      isNegative: true,
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

  const getDeadlineVariant = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 1) return "destructive";
    if (days <= 3) return "default";
    return "secondary";
  };

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[{ label: "Student" }, { label: "Dashboard" }]}
    >
      <div className="space-y-6 pt-4">
        {/* Welcome Section */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome back, {dbUser?.firstName || "Student"}
                </h2>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-muted-foreground">
                Track your assignments, submissions, and grades
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/student/alas">
                <Target className="mr-2 h-4 w-4" />
                View All ALAs
              </Link>
            </Button>
          </div>
        </FadeIn>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <SlideUp key={stat.title} delay={index * 75}>
              <Card className={`group transition-all duration-300 hover:shadow-md ${stat.borderColor} ${stat.highlight ? (stat.isNegative ? "ring-2 ring-red-500/20" : "ring-2 ring-orange-500/20") : ""}`}>
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
                    <span className={`text-3xl font-bold tabular-nums ${stat.highlight && stat.isNegative ? "text-red-600" : ""}`}>
                      {stat.value}
                    </span>
                    {stat.highlight && stat.value > 0 && (
                      <Badge variant={stat.isNegative ? "destructive" : "default"} className="text-xs">
                        {stat.isNegative ? "Action needed" : "Urgent"}
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
          {/* Upcoming Deadlines */}
          <FadeIn delay={300}>
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Upcoming Deadlines
                    {stats.dueSoon > 0 && (
                      <Badge variant="default" className="ml-1">
                        {stats.dueSoon} due soon
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>ALAs due soon</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/deadlines">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 pt-4">
                {upcomingDeadlines.length === 0 ? (
                  <IllustratedEmpty preset="noDeadlines" size="sm" />
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
                        const deadlineText = formatDeadline(ala.deadline);
                        const variant = getDeadlineVariant(ala.deadline);
                        return (
                          <Link
                            key={ala._id}
                            href={`/student/alas/${ala._id}`}
                            className="group/item flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:bg-accent/50 hover:shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${variant === "destructive" ? "bg-red-500/10" : variant === "default" ? "bg-orange-500/10" : "bg-blue-500/10"}`}>
                                <FileText className={`h-4 w-4 ${variant === "destructive" ? "text-red-600" : variant === "default" ? "text-orange-600" : "text-blue-600"}`} />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">
                                  {ala.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {ala.subjectOfferingId?.subjectId?.code || ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={variant} className="gap-1">
                                <Clock className="h-3 w-3" />
                                {deadlineText}
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100" />
                            </div>
                          </Link>
                        );
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          {/* Recent Grades */}
          <FadeIn delay={375}>
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    Recent Grades
                  </CardTitle>
                  <CardDescription>Your latest results</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/grades">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 pt-4">
                {recentGrades.length === 0 ? (
                  <IllustratedEmpty preset="noGrades" size="sm" />
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
                          (sub.marks / sub.alaId.maxMarks) * 100
                        );
                        const getGradeColor = (pct: number) => {
                          if (pct >= 80) return "text-emerald-600";
                          if (pct >= 60) return "text-blue-600";
                          if (pct >= 40) return "text-orange-600";
                          return "text-red-600";
                        };
                        const getProgressColor = (pct: number) => {
                          if (pct >= 80) return "bg-emerald-500";
                          if (pct >= 60) return "bg-blue-500";
                          if (pct >= 40) return "bg-orange-500";
                          return "bg-red-500";
                        };
                        return (
                          <Link
                            key={sub._id}
                            href={`/student/alas/${sub.alaId._id}`}
                            className="group/item flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:bg-accent/50 hover:shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">
                                  {sub.alaId.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {sub.alaId.subjectOfferingId?.subjectId?.code || ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-24 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className={`font-bold tabular-nums ${getGradeColor(percentage)}`}>
                                    {sub.marks}/{sub.alaId.maxMarks}
                                  </span>
                                  <span className="text-muted-foreground tabular-nums">
                                    {percentage}%
                                  </span>
                                </div>
                                <Progress 
                                  value={percentage} 
                                  className="h-1.5"
                                  style={{
                                    ["--progress-background" as string]: getProgressColor(percentage),
                                  }}
                                />
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100" />
                            </div>
                          </Link>
                        );
                      }
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
