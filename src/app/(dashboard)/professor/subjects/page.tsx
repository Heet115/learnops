import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { connectDB, User, SubjectOffering, ALA, Submission } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookMarked,
  Users,
  FileText,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  GraduationCap,
} from "lucide-react";

async function getProfessorSubjects() {
  const { userId } = await auth();
  if (!userId) return [];

  await connectDB();
  const professor = await User.findOne({ clerkId: userId, isActive: true });
  if (!professor) return [];

  const offerings = await SubjectOffering.find({
    professorId: professor._id,
    isActive: true,
  })
    .populate("subjectId", "name code credits")
    .populate("classId", "name academicYear")
    .populate("semesterId", "name number")
    .lean();

  // Get stats for each offering
  const offeringStats = await Promise.all(
    offerings.map(async (off) => {
      const alas = await ALA.find({
        subjectOfferingId: off._id,
        isActive: true,
      }).select("_id");
      const alaIds = alas.map((a) => a._id);

      const [studentCount, pending] = await Promise.all([
        User.countDocuments({
          role: "student",
          classId: off.classId,
          isActive: true,
        }),
        Submission.countDocuments({
          alaId: { $in: alaIds },
          status: "submitted",
        }),
      ]);

      return { ...off, alaCount: alas.length, studentCount, pending };
    })
  );

  return JSON.parse(JSON.stringify(offeringStats));
}

export default async function ProfessorSubjectsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const [dbUser, subjects] = await Promise.all([
    getCurrentUserFromDB(),
    getProfessorSubjects(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  // Calculate stats
  const totalStudents = subjects.reduce(
    (acc: number, s: { studentCount: number }) => acc + s.studentCount,
    0
  );
  const totalALAs = subjects.reduce(
    (acc: number, s: { alaCount: number }) => acc + s.alaCount,
    0
  );
  const totalPending = subjects.reduce(
    (acc: number, s: { pending: number }) => acc + s.pending,
    0
  );

  const statCards = [
    {
      title: "Total Subjects",
      value: subjects.length,
      icon: BookMarked,
      color: "blue",
    },
    {
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "violet",
    },
    {
      title: "ALAs Created",
      value: totalALAs,
      icon: FileText,
      color: "emerald",
    },
    {
      title: "Pending Review",
      value: totalPending,
      icon: Clock,
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
      role="professor"
      user={user}
      breadcrumbs={[{ label: "Professor" }, { label: "My Subjects" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">My Subjects</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {subjects.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Subjects assigned to you this semester
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

        {subjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <BookMarked className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No subjects assigned</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Contact admin to get subjects assigned to you.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map(
              (offering: {
                _id: string;
                academicYear: string;
                alaCount: number;
                studentCount: number;
                pending: number;
                subjectId?: { name: string; code: string; credits: number };
                classId?: { name: string; academicYear: string };
                semesterId?: { name: string; number: number };
              }) => (
                <Card
                  key={offering._id}
                  className="group relative overflow-hidden transition-all hover:shadow-md"
                >
                  <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-violet-500/10 opacity-50 transition-transform group-hover:scale-150" />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge
                        variant="outline"
                        className="font-mono border-blue-500/30 bg-blue-500/10 text-blue-600"
                      >
                        {offering.subjectId?.code}
                      </Badge>
                      {offering.pending > 0 && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                        >
                          <span className="inline-block mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {offering.pending} pending
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-2 text-lg">
                      {offering.subjectId?.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {offering.classId?.name} • {offering.semesterId?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" /> Students
                        </span>
                        <Badge
                          variant="outline"
                          className="border-violet-500/30 bg-violet-500/10 text-violet-600"
                        >
                          {offering.studentCount}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4" /> ALAs Created
                        </span>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        >
                          {offering.alaCount}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Award className="h-4 w-4" /> Credits
                        </span>
                        <Badge variant="outline">
                          {offering.subjectId?.credits}
                        </Badge>
                      </div>
                      <Button variant="outline" className="mt-2 w-full" asChild>
                        <Link href={`/professor/alas?subject=${offering._id}`}>
                          View ALAs <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
