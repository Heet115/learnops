import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getHodDashboardStats,
  getHodDepartmentOverview,
} from "@/lib/actions/dashboard.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FadeIn, SlideUp } from "@/components/ui/page-transition";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import {
  Users,
  BookOpen,
  FileCheck,
  BarChart3,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Building2,
  Sparkles,
} from "lucide-react";

export default async function HodDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "hod") {
    redirect("/unauthorized");
  }

  const [dbUser, stats, overview] = await Promise.all([
    getCurrentUserFromDB(),
    getHodDashboardStats(),
    getHodDepartmentOverview(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "HOD"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const statCards = [
    {
      title: "Professors",
      value: stats.professors,
      icon: Users,
      description: "In department",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "group-hover:border-blue-500/30",
    },
    {
      title: "Subjects",
      value: stats.subjects,
      icon: BookOpen,
      description: "Total subjects",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "group-hover:border-purple-500/30",
    },
    {
      title: "Pending Review",
      value: stats.pendingSubmissions,
      icon: FileCheck,
      description: "Awaiting grading",
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "group-hover:border-orange-500/30",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate}%`,
      icon: BarChart3,
      description: "ALA completion",
      color: stats.completionRate >= 70 ? "text-emerald-600" : "text-yellow-600",
      bgColor: stats.completionRate >= 70 ? "bg-emerald-500/10" : "bg-yellow-500/10",
      borderColor: stats.completionRate >= 70 ? "group-hover:border-emerald-500/30" : "group-hover:border-yellow-500/30",
      showProgress: true,
      progressValue: stats.completionRate,
    },
  ];

  return (
    <DashboardLayout
      role="hod"
      user={user}
      breadcrumbs={[{ label: "HOD" }, { label: "Dashboard" }]}
    >
      <div className="space-y-6 pt-4">
        {/* Welcome Section */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome back, {dbUser?.firstName || "Head of Department"}
                </h2>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-muted-foreground">
                Monitor your department&apos;s performance and activities
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/hod/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </div>
        </FadeIn>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <SlideUp key={stat.title} delay={index * 75}>
              <Card className={`group transition-all duration-300 hover:shadow-md ${stat.borderColor}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">
                      {stat.value}
                    </span>
                    {!stat.showProgress && (
                      <Badge variant="secondary" className="gap-1 text-xs font-normal">
                        <TrendingUp className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  {stat.showProgress ? (
                    <Progress value={stat.progressValue} className="h-2" />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </SlideUp>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Courses Card */}
          <FadeIn delay={300}>
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    Courses
                  </CardTitle>
                  <CardDescription>Courses in your department</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/hod/department">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 pt-4">
                {overview.courses.length === 0 ? (
                  <IllustratedEmpty
                    preset="noSubjects"
                    title="No courses found"
                    description="Courses will appear here once created."
                    size="sm"
                  />
                ) : (
                  <div className="space-y-3">
                    {overview.courses.map(
                      (course: { _id: string; name: string; code: string }) => (
                        <div
                          key={course._id}
                          className="group/item flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:bg-accent/50 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                              <GraduationCap className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">
                                {course.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {course.code}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">Course</Badge>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          {/* Classes Card */}
          <FadeIn delay={375}>
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Classes
                  </CardTitle>
                  <CardDescription>Active classes in department</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/hod/classes">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 pt-4">
                {overview.classes.length === 0 ? (
                  <IllustratedEmpty
                    preset="noClasses"
                    title="No classes found"
                    description="Classes will appear here once created."
                    size="sm"
                  />
                ) : (
                  <div className="space-y-3">
                    {overview.classes.slice(0, 5).map(
                      (cls: {
                        _id: string;
                        name: string;
                        academicYear: string;
                        semesterId?: {
                          name: string;
                          courseId?: { code: string };
                        };
                      }) => (
                        <div
                          key={cls._id}
                          className="group/item flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:bg-accent/50 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">
                                {cls.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cls.semesterId?.courseId?.code} • {cls.semesterId?.name}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{cls.academicYear}</Badge>
                        </div>
                      )
                    )}
                    {overview.classes.length > 5 && (
                      <div className="pt-2 text-center">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/hod/classes">
                            +{overview.classes.length - 5} more classes
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
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
