import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { connectDB, User, Department, Course, Semester, Subject, Class } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, BookOpen, Calendar, GraduationCap, BookMarked } from "lucide-react";

async function getHodDepartmentDetails() {
  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();
  const hod = await User.findOne({ clerkId: userId, isActive: true });
  if (!hod || !hod.departmentId) return null;

  const department = await Department.findById(hod.departmentId).lean();
  if (!department) return null;

  const courses = await Course.find({ departmentId: department._id, isActive: true }).lean();
  const courseIds = courses.map(c => c._id);

  const semesters = await Semester.find({ courseId: { $in: courseIds }, isActive: true }).lean();
  const semesterIds = semesters.map(s => s._id);

  const [subjects, classes] = await Promise.all([
    Subject.find({ semesterId: { $in: semesterIds }, isActive: true }).lean(),
    Class.find({ semesterId: { $in: semesterIds }, isActive: true }).lean(),
  ]);

  return {
    department: JSON.parse(JSON.stringify(department)),
    courses: JSON.parse(JSON.stringify(courses)),
    semesters: JSON.parse(JSON.stringify(semesters)),
    subjects: JSON.parse(JSON.stringify(subjects)),
    classes: JSON.parse(JSON.stringify(classes)),
  };
}

export default async function HodDepartmentPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "hod") {
    redirect("/unauthorized");
  }

  const [dbUser, data] = await Promise.all([
    getCurrentUserFromDB(),
    getHodDepartmentDetails(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "HOD"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  if (!data) {
    return (
      <DashboardLayout role="hod" user={user} breadcrumbs={[{ label: "HOD" }, { label: "Department" }]}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No department assigned</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: "Courses", value: data.courses.length, icon: BookOpen, color: "text-blue-600" },
    { label: "Semesters", value: data.semesters.length, icon: Calendar, color: "text-purple-600" },
    { label: "Subjects", value: data.subjects.length, icon: BookMarked, color: "text-green-600" },
    { label: "Classes", value: data.classes.length, icon: GraduationCap, color: "text-orange-600" },
  ];

  return (
    <DashboardLayout role="hod" user={user} breadcrumbs={[{ label: "HOD" }, { label: "Department" }]}>
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{data.department.name}</h2>
            <p className="text-muted-foreground">Department Code: {data.department.code}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>Programs offered in this department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.courses.map((course: { _id: string; name: string; code: string; duration: number }) => (
                  <div key={course._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-muted-foreground">{course.code}</p>
                    </div>
                    <Badge variant="outline">{course.duration} years</Badge>
                  </div>
                ))}
                {data.courses.length === 0 && (
                  <p className="text-sm text-muted-foreground">No courses found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              <CardDescription>Active sections in department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.classes.slice(0, 6).map((cls: { _id: string; name: string; academicYear: string }) => (
                  <div key={cls._id} className="flex items-center justify-between rounded-lg border p-3">
                    <p className="font-medium">{cls.name}</p>
                    <Badge variant="secondary">{cls.academicYear}</Badge>
                  </div>
                ))}
                {data.classes.length === 0 && (
                  <p className="text-sm text-muted-foreground">No classes found</p>
                )}
                {data.classes.length > 6 && (
                  <p className="text-center text-sm text-muted-foreground">+{data.classes.length - 6} more</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
