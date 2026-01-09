import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  connectDB,
  User,
  Course,
  Semester,
  Class,
  SubjectOffering,
} from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HodClassesTable } from "@/components/hod/hod-classes-table";
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
} from "lucide-react";

async function getHodClasses() {
  const { userId } = await auth();
  if (!userId) return [];

  await connectDB();
  const hod = await User.findOne({ clerkId: userId, isActive: true });
  if (!hod || !hod.departmentId) return [];

  const courses = await Course.find({
    departmentId: hod.departmentId,
    isActive: true,
  }).select("_id");
  const courseIds = courses.map((c) => c._id);

  const semesters = await Semester.find({
    courseId: { $in: courseIds },
    isActive: true,
  }).select("_id");
  const semesterIds = semesters.map((s) => s._id);

  const classes = await Class.find({
    semesterId: { $in: semesterIds },
    isActive: true,
  })
    .populate({
      path: "semesterId",
      select: "name number courseId",
      populate: { path: "courseId", select: "name code" },
    })
    .sort({ academicYear: -1, name: 1 })
    .lean();

  // Get student count and subject count for each class
  const classStats = await Promise.all(
    classes.map(async (cls) => {
      const [studentCount, subjectCount] = await Promise.all([
        User.countDocuments({
          role: "student",
          classId: cls._id,
          isActive: true,
        }),
        SubjectOffering.countDocuments({ classId: cls._id, isActive: true }),
      ]);
      return { ...cls, studentCount, subjectCount };
    }),
  );

  return JSON.parse(JSON.stringify(classStats));
}

export default async function HodClassesPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "hod") {
    redirect("/unauthorized");
  }

  const [dbUser, classes] = await Promise.all([
    getCurrentUserFromDB(),
    getHodClasses(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "HOD"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  // Calculate stats
  const totalStudents = classes.reduce(
    (acc: number, c: { studentCount: number }) => acc + c.studentCount,
    0,
  );
  const totalSubjects = classes.reduce(
    (acc: number, c: { subjectCount: number }) => acc + c.subjectCount,
    0,
  );
  const uniqueAcademicYears = new Set(
    classes.map((c: { academicYear: string }) => c.academicYear),
  ).size;

  const statCards = [
    {
      title: "Total Classes",
      value: classes.length,
      icon: GraduationCap,
      color: "blue",
    },
    {
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "violet",
    },
    {
      title: "Subject Offerings",
      value: totalSubjects,
      icon: BookOpen,
      color: "emerald",
    },
    {
      title: "Academic Years",
      value: uniqueAcademicYears,
      icon: Calendar,
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
      breadcrumbs={[{ label: "HOD" }, { label: "Classes" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Classes</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {classes.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground">
              All sections in your department
            </p>
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
              <div>
                <CardTitle>All Classes</CardTitle>
                <CardDescription>
                  View class details and student enrollment
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <HodClassesTable classes={classes} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
