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
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { FadeIn, SlideUp } from "@/components/ui/page-transition";
import { DashboardActivity } from "@/components/activity";
import {
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  ArrowRight,
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
        <FadeIn>
          <div>
            <h2 className="text-2xl font-bold">
              Welcome back, {dbUser?.firstName || "Admin"}
            </h2>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening in your institution
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <SlideUp key={stat.title} delay={index * 75}>
              <Card className="card-hover group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon
                    className={`h-4 w-4 ${stat.color} transition-transform duration-200 group-hover:scale-110`}
                  />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold tabular-nums ${stat.color}`}
                  >
                    {stat.value}
                  </div>
                  <CardDescription>{stat.description}</CardDescription>
                </CardContent>
              </Card>
            </SlideUp>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FadeIn delay={300}>
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
                        profileImage?: string;
                        createdAt: string;
                      }) => (
                        <div
                          key={u._id}
                          className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={`${u.firstName} ${u.lastName}`}
                              image={u.profileImage}
                              size="sm"
                            />
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
          </FadeIn>

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
