import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  getAllCourses,
  getAllDepartments,
} from "@/lib/actions/academic.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { CoursesTable } from "@/components/admin/courses-table";
import { CreateCourseDialog } from "@/components/admin/create-course-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default async function CoursesPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [courses, departments, dbUser] = await Promise.all([
    getAllCourses(),
    getAllDepartments(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Admin"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Courses" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Courses</h2>
            <p className="text-muted-foreground">Manage academic courses</p>
          </div>
          <CreateCourseDialog departments={departments} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Courses
              </CardTitle>
              <BookOpen className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <CoursesTable courses={courses} departments={departments} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
