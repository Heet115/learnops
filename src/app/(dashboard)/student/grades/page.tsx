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
import { Award, TrendingUp, BarChart3 } from "lucide-react";

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
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 90) return { label: "A+", variant: "default" as const };
    if (percentage >= 80) return { label: "A", variant: "default" as const };
    if (percentage >= 70) return { label: "B", variant: "secondary" as const };
    if (percentage >= 60) return { label: "C", variant: "secondary" as const };
    if (percentage >= 50) return { label: "D", variant: "outline" as const };
    return { label: "F", variant: "destructive" as const };
  };

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[{ label: "Student" }, { label: "Grades" }]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">My Grades</h2>
          <p className="text-muted-foreground">
            View your ALA grades and performance
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Award className="h-4 w-4 text-purple-500" />
                Total Graded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.graded}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getGradeColor(stats.average)}`}
              >
                {stats.average}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Highest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.highest}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lowest</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getGradeColor(stats.lowest)}`}
              >
                {stats.lowest}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Grade History</CardTitle>
            <CardDescription>All your graded submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No grades yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
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
                        <TableRow key={grade._id}>
                          <TableCell>
                            <Link
                              href={`/student/alas/${grade.alaId}`}
                              className="font-medium hover:underline"
                            >
                              {grade.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{grade.subjectCode}</Badge>
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
                            <Badge variant={gradeBadge.variant}>
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
