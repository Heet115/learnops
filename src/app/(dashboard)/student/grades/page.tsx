import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { connectDB, User, Submission } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  TrendingUp,
  BarChart3,
  TrendingDown,
  Trophy,
} from "lucide-react";

const colorMap: Record<string, string> = {
  violet: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

async function getStudentGrades() {
  const { userId } = await auth();
  if (!userId)
    return {
      grades: [],
      stats: { total: 0, graded: 0, average: 0, highest: 0, lowest: 0 },
    };

  await connectDB();
  const student = await User.findOne({ clerkId: userId, isActive: true });
  if (!student)
    return {
      grades: [],
      stats: { total: 0, graded: 0, average: 0, highest: 0, lowest: 0 },
    };

  const submissions = await Submission.find({
    studentId: student._id,
    status: "graded",
  })
    .populate({
      path: "alaId",
      select: "title maxMarks subjectOfferingId",
      populate: {
        path: "subjectOfferingId",
        select: "subjectId",
        populate: { path: "subjectId", select: "name code" },
      },
    })
    .sort({ gradedAt: -1 })
    .lean();

  // Calculate stats
  const grades = submissions.map((sub) => {
    const ala = sub.alaId as unknown as {
      title: string;
      maxMarks: number;
      subjectOfferingId?: { subjectId?: { name: string; code: string } };
    };
    const percentage = Math.round((sub.marks! / ala.maxMarks) * 100);
    return {
      _id: sub._id.toString(),
      alaId: (
        sub.alaId as unknown as { _id: { toString(): string } }
      )._id.toString(),
      title: ala.title,
      subjectCode: ala.subjectOfferingId?.subjectId?.code || "",
      subjectName: ala.subjectOfferingId?.subjectId?.name || "",
      marks: sub.marks!,
      maxMarks: ala.maxMarks,
      percentage,
      feedback: sub.feedback,
      gradedAt: sub.gradedAt,
    };
  });

  const percentages = grades.map((g) => g.percentage);
  const stats = {
    total: grades.length,
    graded: grades.length,
    average:
      grades.length > 0
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / grades.length)
        : 0,
    highest: grades.length > 0 ? Math.max(...percentages) : 0,
    lowest: grades.length > 0 ? Math.min(...percentages) : 0,
  };

  return { grades: JSON.parse(JSON.stringify(grades)), stats };
}

export default async function StudentGradesPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, { grades, stats }] = await Promise.all([
    getCurrentUserFromDB(),
    getStudentGrades(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 90)
      return {
        label: "A+",
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
      };
    if (percentage >= 80)
      return {
        label: "A",
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
      };
    if (percentage >= 70)
      return {
        label: "B",
        className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
      };
    if (percentage >= 60)
      return {
        label: "C",
        className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
      };
    if (percentage >= 50)
      return {
        label: "D",
        className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
      };
    return {
      label: "F",
      className: "border-rose-500/30 bg-rose-500/10 text-rose-600",
    };
  };

  const statCards = [
    {
      title: "Total Graded",
      value: stats.graded,
      icon: Award,
      color: "violet",
    },
    {
      title: "Average Score",
      value: `${stats.average}%`,
      icon: BarChart3,
      color: "blue",
    },
    {
      title: "Highest",
      value: `${stats.highest}%`,
      icon: TrendingUp,
      color: "emerald",
    },
    {
      title: "Lowest",
      value: `${stats.lowest}%`,
      icon: TrendingDown,
      color: "amber",
    },
  ];

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[{ label: "Student" }, { label: "Grades" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">My Grades</h2>
              <Badge variant="secondary" className="text-sm">
                {stats.graded} Graded
              </Badge>
            </div>
            <p className="text-muted-foreground">
              View your ALA grades and performance
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
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${colorMap[stat.color]}`}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <Trophy className="text-primary h-4 w-4" />
              </div>
              <div>
                <CardTitle>Grade History</CardTitle>
                <CardDescription>All your graded submissions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {grades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                  <Award className="text-muted-foreground h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-medium">No grades yet</p>
                <p className="text-muted-foreground text-sm">
                  Your graded submissions will appear here
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>ALA</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map(
                      (grade: {
                        _id: string;
                        alaId: string;
                        title: string;
                        subjectCode: string;
                        marks: number;
                        maxMarks: number;
                        percentage: number;
                        gradedAt: string;
                      }) => {
                        const gradeBadge = getGradeBadge(grade.percentage);
                        return (
                          <TableRow key={grade._id} className="group">
                            <TableCell>
                              <Link
                                href={`/student/alas/${grade.alaId}`}
                                className="font-medium hover:underline"
                              >
                                {grade.title}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                              >
                                {grade.subjectCode}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">{grade.marks}</span>
                              <span className="text-muted-foreground">
                                /{grade.maxMarks}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={grade.percentage}
                                  className="h-2 w-16"
                                />
                                <span
                                  className={`text-sm font-medium ${getGradeColor(grade.percentage)}`}
                                >
                                  {grade.percentage}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={gradeBadge.className}
                              >
                                {gradeBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(grade.gradedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
