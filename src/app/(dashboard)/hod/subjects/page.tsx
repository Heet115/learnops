import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  connectDB,
  User,
  Course,
  Semester,
  Subject,
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
import { HodSubjectsTable } from "@/components/hod/hod-subjects-table";
import { BookMarked, Layers, Award, Users, TrendingUp } from "lucide-react";

async function getHodSubjects() {
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

  const subjects = await Subject.find({
    semesterId: { $in: semesterIds },
    isActive: true,
  })
    .populate({
      path: "semesterId",
      select: "name number courseId",
      populate: { path: "courseId", select: "name code" },
    })
    .sort({ code: 1 })
    .lean();

  // Get offering count for each subject
  const subjectStats = await Promise.all(
    subjects.map(async (sub) => {
      const offeringCount = await SubjectOffering.countDocuments({
        subjectId: sub._id,
        isActive: true,
      });
      return { ...sub, offeringCount };
    }),
  );

  return JSON.parse(JSON.stringify(subjectStats));
}

export default async function HodSubjectsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "hod") {
    redirect("/unauthorized");
  }

  const [dbUser, subjects] = await Promise.all([
    getCurrentUserFromDB(),
    getHodSubjects(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "HOD"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  // Calculate stats
  const totalCredits = subjects.reduce(
    (acc: number, s: { credits: number }) => acc + s.credits,
    0,
  );
  const totalOfferings = subjects.reduce(
    (acc: number, s: { offeringCount: number }) => acc + s.offeringCount,
    0,
  );
  const subjectsWithOfferings = subjects.filter(
    (s: { offeringCount: number }) => s.offeringCount > 0,
  ).length;

  const statCards = [
    {
      title: "Total Subjects",
      value: subjects.length,
      icon: BookMarked,
      color: "blue",
    },
    {
      title: "Total Credits",
      value: totalCredits,
      icon: Award,
      color: "violet",
    },
    {
      title: "Active Offerings",
      value: totalOfferings,
      icon: Users,
      color: "emerald",
    },
    {
      title: "Assigned Subjects",
      value: subjectsWithOfferings,
      icon: Layers,
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
      breadcrumbs={[{ label: "HOD" }, { label: "Subjects" }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">Subjects</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {subjects.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              All subjects in your department
            </p>
          </div>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <BookMarked className="text-primary h-4 w-4" />
              </div>
              <div>
                <CardTitle>All Subjects</CardTitle>
                <CardDescription>
                  View subject details and assignments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <HodSubjectsTable subjects={subjects} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
