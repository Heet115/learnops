import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  connectDB,
  User,
  Department,
  Course,
  Semester,
  Subject,
  Class,
} from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  BookOpen,
  Calendar,
  GraduationCap,
  BookMarked,
  TrendingUp,
  Clock,
} from "lucide-react";

async function getHodDepartmentDetails() {
  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();
  const hod = await User.findOne({ clerkId: userId, isActive: true });
  if (!hod || !hod.departmentId) return null;

  const department = await Department.findById(hod.departmentId).lean();
  if (!department) return null;

  const courses = await Course.find({
    departmentId: department._id,
    isActive: true,
  }).lean();
  const courseIds = courses.map((c) => c._id);

  const semesters = await Semester.find({
    courseId: { $in: courseIds },
    isActive: true,
  }).lean();
  const semesterIds = semesters.map((s) => s._id);

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
      <DashboardLayout
        role="hod"
        user={user}
        breadcrumbs={[{ label: "HOD" }, { label: "Department" }]}
      >
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
            <Building2 className="text-muted-foreground h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No department assigned</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Contact admin to assign you to a department.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: "Courses",
      value: data.courses.length,
      icon: BookOpen,
      color: "blue",
    },
    {
      title: "Semesters",
      value: data.semesters.length,
      icon: Calendar,
      color: "violet",
    },
    {
      title: "Subjects",
      value: data.subjects.length,
      icon: BookMarked,
      color: "emerald",
    },
    {
      title: "Classes",
      value: data.classes.length,
      icon: GraduationCap,
      color: "amber",
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
      role="hod"
      user={user}
      breadcrumbs={[{ label: "HOD" }, { label: "Department" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <Building2 className="text-primary h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{data.department.name}</h2>
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Active
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Department Code: {data.department.code}
              </p>
            </div>
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
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600"
                  >
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Courses Card */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle>Courses</CardTitle>
                <CardDescription>
                  All courses offered in {data.department.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                  <BookOpen className="text-muted-foreground h-6 w-6" />
                </div>
                <p className="text-muted-foreground mt-3 text-sm">
                  No courses found in this department
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.courses.map(
                  (course: {
                    _id: string;
                    name: string;
                    code: string;
                    duration: number;
                    isActive: boolean;
                  }) => {
                    const courseSemesters = data.semesters.filter(
                      (s: { courseId: string }) =>
                        s.courseId?.toString() === course._id?.toString(),
                    );
                    return (
                      <div
                        key={course._id}
                        className="group/item bg-card hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="space-y-1">
                            <p className="leading-none font-medium">
                              {course.name}
                            </p>
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                              <span>{course.code}</span>
                              <span>•</span>
                              <span>{course.duration} years</span>
                              <span>•</span>
                              <span>{courseSemesters.length} semesters</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            course.isActive
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              : "border-red-500/30 bg-red-500/10 text-red-600"
                          }
                        >
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${course.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                          />
                          {course.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <GraduationCap className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle>Classes</CardTitle>
                <CardDescription>
                  All classes/sections in {data.department.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                  <GraduationCap className="text-muted-foreground h-6 w-6" />
                </div>
                <p className="text-muted-foreground mt-3 text-sm">
                  No classes found in this department
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.classes.map(
                  (cls: {
                    _id: string;
                    name: string;
                    academicYear: string;
                    semesterId: string;
                    isActive: boolean;
                  }) => {
                    const semester = data.semesters.find(
                      (s: { _id: string }) =>
                        s._id?.toString() === cls.semesterId?.toString(),
                    );
                    const course = semester
                      ? data.courses.find(
                          (c: { _id: string }) =>
                            c._id?.toString() === semester.courseId?.toString(),
                        )
                      : null;
                    return (
                      <div
                        key={cls._id}
                        className="group/item bg-card hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                            <GraduationCap className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="space-y-1">
                            <p className="leading-none font-medium">
                              {cls.name}
                            </p>
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                              <span>{course?.code || "N/A"}</span>
                              <span>•</span>
                              <span>{semester?.name || "N/A"}</span>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{cls.academicYear}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            cls.isActive
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              : "border-red-500/30 bg-red-500/10 text-red-600"
                          }
                        >
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${cls.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                          />
                          {cls.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
