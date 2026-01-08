import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getAdminDashboardStats,
  getAdminRecentUsers,
} from "@/lib/actions/dashboard.actions";
import { getRecentActivities } from "@/lib/actions/activity.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { FadeIn, SlideUp } from "@/components/ui/page-transition";
import { DashboardActivity } from "@/components/activity";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Plus,
} from "lucide-react";

export default async function AdminDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [dbUser, stats, recentUsers, recentActivities] = await Promise.all([
    getCurrentUserFromDB(),
    getAdminDashboardStats(),
    getAdminRecentUsers(),
    getRecentActivities(5),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Admin"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.users.total,
      icon: Users,
      description: `${stats.users.students} students, ${stats.users.professors} professors`,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "group-hover:border-blue-500/30",
    },
    {
      title: "Departments",
      value: stats.academic.departments,
      icon: Building2,
      description: "Active departments",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "group-hover:border-purple-500/30",
    },
    {
      title: "Courses",
      value: stats.academic.courses,
      icon: BookOpen,
      description: `${stats.academic.subjects} subjects`,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "group-hover:border-emerald-500/30",
    },
    {
      title: "Classes",
      value: stats.academic.classes,
      icon: GraduationCap,
      description: "Active sections",
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "group-hover:border-orange-500/30",
    },
  ];

  const quickActions = [
    { label: "Add User", href: "/admin/users", icon: Users },
    { label: "Add Department", href: "/admin/departments", icon: Building2 },
    { label: "Add Course", href: "/admin/courses", icon: BookOpen },
    { label: "Add Class", href: "/admin/classes", icon: GraduationCap },
  ];

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="space-y-6 pt-4">
        {/* Welcome Section */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome back, {dbUser?.firstName || "Admin"}
                </h2>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-muted-foreground">
                Here&apos;s what&apos;s happening in your institution
              </p>
            </div>
            <div className="flex gap-2">
              {quickActions.slice(0, 2).map((action) => (
                <Button key={action.label} variant="outline" size="sm" asChild>
                  <Link href={action.href}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
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
                <CardContent className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold tabular-nums`}>
                      {stat.value}
                    </span>
                    <Badge variant="secondary" className="gap-1 text-xs font-normal">
                      <TrendingUp className="h-3 w-3" />
                      Active
                    </Badge>
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
          {/* Recent Users */}
          <FadeIn delay={300}>
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Recent Users
                  </CardTitle>
                  <CardDescription>Newly created accounts</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/users">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 pt-4">
                {recentUsers.length === 0 ? (
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-sm text-muted-foreground">No users yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map(
                      (u: {
                        _id: string;
                        firstName: string;
                        lastName: string;
                        email: string;
                        role: string;
                        profileImage?: string;
                        createdAt: string;
                      }) => (
                        <div
                          key={u._id}
                          className="group/item flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:bg-accent/50 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={`${u.firstName} ${u.lastName}`}
                              image={u.profileImage}
                              size="sm"
                            />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RoleBadge
                              role={u.role as "admin" | "hod" | "professor" | "student"}
                              size="xs"
                              showIcon={false}
                            />
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatDate(u.createdAt)}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          {/* Recent Activity */}
          <FadeIn delay={375}>
            <DashboardActivity
              activities={recentActivities}
              title="Recent Activity"
              description="Latest system actions"
              viewAllHref="/admin/audit-trail"
              maxItems={5}
            />
          </FadeIn>
        </div>
      </div>
    </DashboardLayout>
  );
}
