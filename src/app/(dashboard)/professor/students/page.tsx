import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, Users, FileCheck, TrendingUp } from "lucide-react";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  violet: "bg-violet-500/10 text-violet-600 border-violet-500/20",
};

async function getProfessorStudents() {
  const { userId } = await auth();
  if (!userId) return { students: [], classMap: new Map() };

  await connectDB();
  const professor = await User.findOne({ clerkId: userId, isActive: true });
  if (!professor) return { students: [], classMap: new Map() };

  // Get professor's offerings
  const offerings = await SubjectOffering.find({
    professorId: professor._id,
    isActive: true,
  })
    .populate("classId", "name")
    .lean();

  const classIds = [...new Set(offerings.map((o) => o.classId._id.toString()))];
  const classMap = new Map(
    offerings.map((o) => [
      o.classId._id.toString(),
      (o.classId as { name: string }).name,
    ]),
  );

  // Get students in those classes
  const students = await User.find({
    role: "student",
    classId: { $in: classIds },
    isActive: true,
  })
    .select("firstName lastName email profileImage classId")
    .sort({ firstName: 1 })
    .lean();

  // Get ALAs for professor
  const alas = await ALA.find({
    professorId: professor._id,
    isActive: true,
  }).select("_id");
  const alaIds = alas.map((a) => a._id);

  // Get submission stats for each student
  const studentStats = await Promise.all(
    students.map(async (student) => {
      const [submitted, graded] = await Promise.all([
        Submission.countDocuments({
          studentId: student._id,
          alaId: { $in: alaIds },
          status: { $in: ["submitted", "graded"] },
        }),
        Submission.countDocuments({
          studentId: student._id,
          alaId: { $in: alaIds },
          status: "graded",
        }),
      ]);

      // Calculate average marks
      const gradedSubmissions = await Submission.find({
        studentId: student._id,
        alaId: { $in: alaIds },
        status: "graded",
      })
        .populate("alaId", "maxMarks")
        .lean();

      let avgPercentage = 0;
      if (gradedSubmissions.length > 0) {
        const totalPercentage = gradedSubmissions.reduce((acc, sub) => {
          const ala = sub.alaId as unknown as { maxMarks: number };
          return acc + ((sub.marks || 0) / ala.maxMarks) * 100;
        }, 0);
        avgPercentage = Math.round(totalPercentage / gradedSubmissions.length);
      }

      return {
        ...student,
        className: student.classId
          ? classMap.get(student.classId.toString()) || "Unknown"
          : "Unknown",
        submitted,
        graded,
        avgPercentage,
      };
    }),
  );

  return JSON.parse(JSON.stringify(studentStats));
}

export default async function ProfessorStudentsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const [dbUser, students] = await Promise.all([
    getCurrentUserFromDB(),
    getProfessorStudents(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  // Calculate stats
  const totalSubmissions = students.reduce(
    (acc: number, s: { submitted: number }) => acc + s.submitted,
    0
  );
  const totalGraded = students.reduce(
    (acc: number, s: { graded: number }) => acc + s.graded,
    0
  );
  const avgScore =
    students.length > 0
      ? Math.round(
          students.reduce(
            (acc: number, s: { avgPercentage: number }) => acc + s.avgPercentage,
            0
          ) / students.filter((s: { graded: number }) => s.graded > 0).length || 0
        )
      : 0;

  const statCards = [
    {
      title: "Total Students",
      value: students.length,
      icon: Users,
      color: "blue",
    },
    {
      title: "Total Submissions",
      value: totalSubmissions,
      icon: FileCheck,
      color: "emerald",
    },
    {
      title: "Graded Work",
      value: totalGraded,
      icon: GraduationCap,
      color: "amber",
    },
    {
      title: "Avg Score",
      value: `${avgScore || 0}%`,
      icon: TrendingUp,
      color: "violet",
    },
  ];

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[{ label: "Professor" }, { label: "Students" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">My Students</h2>
              <Badge variant="secondary" className="text-sm">
                {students.length} Students
              </Badge>
            </div>
            <p className="text-muted-foreground">Students in your classes</p>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>All Students</CardTitle>
                <CardDescription>
                  View student performance and submissions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm font-medium">No students yet</p>
                <p className="text-muted-foreground text-sm">
                  No students in your classes
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-center">Submitted</TableHead>
                      <TableHead className="text-center">Graded</TableHead>
                      <TableHead className="text-center">Avg Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(
                      (student: {
                        _id: string;
                        firstName: string;
                        lastName: string;
                        email: string;
                        profileImage?: string;
                        className: string;
                        submitted: number;
                        graded: number;
                        avgPercentage: number;
                      }) => (
                        <TableRow key={student._id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.profileImage} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {student.firstName[0]}
                                  {student.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {student.firstName} {student.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                            >
                              {student.className}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {student.submitted}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.graded}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.graded > 0 ? (
                              <Badge
                                variant="outline"
                                className={
                                  student.avgPercentage >= 70
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                    : student.avgPercentage >= 50
                                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                                      : "border-rose-500/30 bg-rose-500/10 text-rose-600"
                                }
                              >
                                {student.avgPercentage}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
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
