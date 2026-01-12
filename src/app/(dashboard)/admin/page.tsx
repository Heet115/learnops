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
import { DashboardActivity } from "@/components/activity";
import {
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Plus,
  Calendar,
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
      color: "blue",
    },
    {
      title: "Departments",
      value: stats.academic.departments,
      icon: Building2,
      description: "Active departments",
      color: "violet",
    },
    {
      title: "Courses",
      value: stats.academic.courses,
      icon: BookOpen,
      description: `${stats.academic.subjects} subjects`,
      color: "emerald",
    },
    {
      title: "Classes",
      value: stats.academic.classes,
      icon: GraduationCap,
      description: "Active sections",
      color: "amber",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    violet: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  };

  const quickActions = [
    { label: "Add User", href: "/admin/users", icon: Users },
    { label: "Add Department", href: "/admin/departments", icon: Building2 },
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
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Welcome back, {dbUser?.firstName || "Admin"}
              </h2>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Here&apos;s what&apos;s happening in your institution
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.label} variant="outline" size="sm" asChild>
                <Link href={action.href}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
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
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[stat.color]}`}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {stat.value}
                  </span>
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs font-normal text-emerald-600"
                  >
                    <TrendingUp className="h-3 w-3" />
                    Active
                  </Badge>
                </div>
                <p className="text-muted-foreground line-clamp-1 text-xs">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Users */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Users className="text-primary h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Recent Users
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Newly created accounts
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/users">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {recentUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                    <Users className="text-muted-foreground h-6 w-6" />
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm">
                    No users yet
                  </p>
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
                        className="group/item bg-card hover:bg-accent/50 flex flex-col gap-2 rounded-lg border p-3 transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={`${u.firstName} ${u.lastName}`}
                            image={u.profileImage}
                            size="sm"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <p className="truncate text-sm leading-none font-medium">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {u.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pl-11 sm:pl-0">
                          <RoleBadge
                            role={
                              u.role as
                                | "admin"
                                | "hod"
                                | "professor"
                                | "student"
                            }
                            size="xs"
                            showIcon={false}
                          />
                          <div className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                            <Calendar className="h-3 w-3" />
                            {formatDate(u.createdAt)}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <DashboardActivity
            activities={recentActivities}
            title="Recent Activity"
            description="Latest system actions"
            viewAllHref="/admin/audit-trail"
            maxItems={5}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
