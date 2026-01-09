import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getAllUsers, getUserStats } from "@/lib/actions/admin.actions";
import { getAllCourses } from "@/lib/actions/academic.actions";
import { getClassesForBulkImport } from "@/lib/actions/bulk-import.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { UsersTable } from "@/components/admin/users-table";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { BulkImportStudentsDialog } from "@/components/admin/bulk-import-students-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

export default async function UsersPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [users, stats, dbUser, courses, classesForImport] = await Promise.all([
    getAllUsers(),
    getUserStats(),
    getCurrentUserFromDB(),
    getAllCourses(),
    getClassesForBulkImport(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Admin"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.total,
      icon: Users,
      color: "blue",
      badge: stats.total > 0 ? "Active" : null,
    },
    {
      title: "Professors",
      value: stats.professors,
      icon: UserCheck,
      color: "violet",
      badge: null,
    },
    {
      title: "Students",
      value: stats.students,
      icon: GraduationCap,
      color: "emerald",
      badge: null,
    },
    {
      title: "Inactive",
      value: stats.inactive,
      icon: UserX,
      color: "amber",
      badge: stats.inactive > 0 ? "Needs Review" : null,
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    violet: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  };

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Users</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.total} total
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Manage all system users and their accounts
            </p>
          </div>
          <div className="flex gap-2">
            <BulkImportStudentsDialog classes={classesForImport} />
            <CreateUserDialog />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              className="group relative overflow-hidden transition-all hover:shadow-md"
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
                  <span className="text-2xl font-bold">{stat.value}</span>
                  {stat.badge && (
                    <Badge
                      variant="outline"
                      className={
                        stat.title === "Inactive"
                          ? "border-amber-500/30 bg-amber-500/10 text-xs text-amber-600"
                          : "border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600"
                      }
                    >
                      {stat.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <Users className="text-primary h-4 w-4" />
              </div>
              <CardTitle>All Users</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <UsersTable users={users} courses={courses} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
