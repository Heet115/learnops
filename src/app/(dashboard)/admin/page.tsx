import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getAdminDashboardStats,
  getAdminRecentUsers,
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
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  ArrowRight,
  FileText,
  UserPlus,
} from "lucide-react";

export default async function AdminDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [dbUser, stats, recentUsers] = await Promise.all([
    getCurrentUserFromDB(),
    getAdminDashboardStats(),
    getAdminRecentUsers(),
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
    },
    {
      title: "Departments",
      value: stats.academic.departments,
      icon: Building2,
      description: "Active departments",
      color: "text-purple-600",
    },
    {
      title: "Courses",
      value: stats.academic.courses,
      icon: BookOpen,
      description: `${stats.academic.subjects} subjects`,
      color: "text-green-600",
    },
    {
      title: "Classes",
      value: stats.academic.classes,
      icon: GraduationCap,
      description: "Active sections",
      color: "text-orange-600",
    },
  ];

  const getRoleBadge = (role: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "outline" | "destructive"
    > = {
      admin: "destructive",
      hod: "default",
      professor: "secondary",
      student: "outline",
    };
    return variants[role] || "outline";
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, {dbUser?.firstName || "Admin"}
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening in your institution
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
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Newly created accounts</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/users">
                  Manage users
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map(
                    (u: {
                      _id: string;
                      firstName: string;
                      lastName: string;
                      email: string;
                      role: string;
                      createdAt: string;
                    }) => (
                      <div
                        key={u._id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <UserPlus className="text-muted-foreground h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {u.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getRoleBadge(u.role)}
                            className="capitalize"
                          >
                            {u.role}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>System activity summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">Active ALAs</span>
                </div>
                <span className="text-sm font-bold">{stats.activity.alas}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <GraduationCap className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">Total Submissions</span>
                </div>
                <span className="text-sm font-bold">
                  {stats.activity.submissions}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Users className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">HODs</span>
                </div>
                <span className="text-sm font-bold">{stats.users.hods}</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground text-sm">
                  All systems operational
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
