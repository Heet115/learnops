import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getAllClasses } from "@/lib/actions/academic.actions";
import {
  getCurrentUserFromDB,
  getAllStudents,
} from "@/lib/actions/user.actions";
import { StudentAssignmentsTable } from "@/components/admin/student-assignments-table";
import { AssignStudentDialog } from "@/components/admin/assign-student-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  UserCheck,
  UserX,
  Users,
  TrendingUp,
} from "lucide-react";

export default async function StudentAssignmentsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [students, classes, dbUser] = await Promise.all([
    getAllStudents(),
    getAllClasses(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Admin"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const assignedCount = students.filter(
    (s: { classId?: unknown }) => s.classId,
  ).length;
  const unassignedCount = students.length - assignedCount;

  // Count unique classes with students
  const uniqueClasses = new Set(
    students
      .filter((s: { classId?: { _id: unknown } }) => s.classId)
      .map((s: { classId?: { _id: unknown } }) => s.classId?._id?.toString()),
  ).size;

  const statCards = [
    {
      title: "Total Students",
      value: students.length,
      icon: Users,
      color: "blue",
      badge: assignedCount > 0 ? "Active" : null,
    },
    {
      title: "Assigned",
      value: assignedCount,
      icon: UserCheck,
      color: "emerald",
      badge: null,
    },
    {
      title: "Unassigned",
      value: unassignedCount,
      icon: UserX,
      color: "amber",
      badge: null,
    },
    {
      title: "Classes",
      value: uniqueClasses,
      icon: GraduationCap,
      color: "violet",
      badge: null,
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
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Student Assignments" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">
                Student Assignments
              </h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {students.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Assign students to classes/sections
            </p>
          </div>
          <AssignStudentDialog students={students} classes={classes} />
        </div>

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
                      className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600"
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
                <GraduationCap className="text-primary h-4 w-4" />
              </div>
              <CardTitle>All Students</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <StudentAssignmentsTable students={students} classes={classes} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
