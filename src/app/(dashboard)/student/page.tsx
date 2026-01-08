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

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };

  const statCards = [
    {
      title: "Pending ALAs",
      value: stats.pending,
      icon: FileText,
      description: "To submit",
      color: "blue",
      highlight: false,
      isNegative: false,
    },
    {
      title: "Due Soon",
      value: stats.dueSoon,
      icon: Clock,
      description: "Within 3 days",
      color: "amber",
      highlight: stats.dueSoon > 0,
      isNegative: false,
    },
    {
      title: "Submitted",
      value: stats.submitted,
      icon: CheckCircle,
      description: "This semester",
      color: "emerald",
      highlight: false,
      isNegative: false,
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      description: "Missed deadline",
      color: "rose",
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
              <Card
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md ${stat.highlight ? (stat.isNegative ? "ring-2 ring-rose-500/20" : "ring-2 ring-amber-500/20") : ""}`}
              >
                <div
                  className={`absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full ${colorMap[stat.color].split(" ")[0]} opacity-50 transition-transform group-hover:scale-150`}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${colorMap[stat.color]}`}
                  >
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-bold tabular-nums ${stat.highlight && stat.isNegative ? "text-rose-600" : ""}`}
                    >
                      {stat.value}
                    </span>
                    {stat.highlight && stat.value > 0 && (
                      <Badge
                        variant="outline"
                        className={
                          stat.isNegative
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                        }
                      >
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${stat.isNegative ? "bg-rose-500" : "bg-amber-500"}`}
                        />
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
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Upcoming Deadlines
                      {stats.dueSoon > 0 && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                        >
                          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {stats.dueSoon} due soon
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>ALAs due soon</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/deadlines">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="flex-1 pt-6">
                {upcomingDeadlines.length === 0 ? (
                  <IllustratedEmpty preset="noDeadlines" size="sm" />
                ) : (
                  <div className="space-y-2">
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
                            className="group/item flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:bg-muted/50 hover:shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${variant === "destructive" ? "bg-rose-500/10" : variant === "default" ? "bg-amber-500/10" : "bg-blue-500/10"}`}
                              >
                                <FileText
                                  className={`h-4 w-4 ${variant === "destructive" ? "text-rose-600" : variant === "default" ? "text-amber-600" : "text-blue-600"}`}
                                />
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
                              <Badge
                                variant="outline"
                                className={`gap-1 ${variant === "destructive" ? "border-rose-500/30 bg-rose-500/10 text-rose-600" : variant === "default" ? "border-amber-500/30 bg-amber-500/10 text-amber-600" : "border-blue-500/30 bg-blue-500/10 text-blue-600"}`}
                              >
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
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Trophy className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle>Recent Grades</CardTitle>
                    <CardDescription>Your latest results</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/grades">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="flex-1 pt-6">
                {recentGrades.length === 0 ? (
                  <IllustratedEmpty preset="noGrades" size="sm" />
                ) : (
                  <div className="space-y-2">
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
                          if (pct >= 40) return "text-amber-600";
                          return "text-rose-600";
                        };
                        const getProgressColor = (pct: number) => {
                          if (pct >= 80) return "bg-emerald-500";
                          if (pct >= 60) return "bg-blue-500";
                          if (pct >= 40) return "bg-amber-500";
                          return "bg-rose-500";
                        };
                        return (
                          <Link
                            key={sub._id}
                            href={`/student/alas/${sub.alaId._id}`}
                            className="group/item flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:bg-muted/50 hover:shadow-sm"
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
                                  {sub.alaId.subjectOfferingId?.subjectId
                                    ?.code || ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-24 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span
                                    className={`font-bold tabular-nums ${getGradeColor(percentage)}`}
                                  >
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
                                    ["--progress-background" as string]:
                                      getProgressColor(percentage),
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
