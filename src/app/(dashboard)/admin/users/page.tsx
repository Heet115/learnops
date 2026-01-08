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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FadeIn, SlideUp } from "@/components/ui/page-transition";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  TrendingUp,
  Shield,
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
      description: "All registered users",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "group-hover:border-blue-500/30",
    },
    {
      title: "Professors",
      value: stats.professors,
      icon: UserCheck,
      description: "Teaching staff",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "group-hover:border-purple-500/30",
    },
    {
      title: "Students",
      value: stats.students,
      icon: GraduationCap,
      description: "Enrolled students",
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "group-hover:border-emerald-500/30",
    },
    {
      title: "Inactive",
      value: stats.inactive,
      icon: UserX,
      description: "Deactivated accounts",
      color: stats.inactive > 0 ? "text-red-600" : "text-muted-foreground",
      bgColor: stats.inactive > 0 ? "bg-red-500/10" : "bg-muted",
      borderColor: stats.inactive > 0 ? "group-hover:border-red-500/30" : "",
    },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
    >
      <div className="space-y-6 pt-4">
        {/* Header Section */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
              </div>
              <p className="text-muted-foreground">
                Create, manage, and monitor all system users
              </p>
            </div>
            <div className="flex gap-2">
              <BulkImportStudentsDialog classes={classesForImport} />
              <CreateUserDialog />
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
                    <span className="text-3xl font-bold tabular-nums">
                      {stat.value}
                    </span>
                    {stat.value > 0 && stat.title !== "Inactive" && (
                      <Badge variant="secondary" className="gap-1 text-xs font-normal">
                        <TrendingUp className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                    {stat.title === "Inactive" && stat.value > 0 && (
                      <Badge variant="destructive" className="text-xs font-normal">
                        Needs review
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

        {/* Users Table Card */}
        <FadeIn delay={300}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    All Users
                  </CardTitle>
                  <CardDescription>
                    {users.length} total users in the system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <UsersTable users={users} courses={courses} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
