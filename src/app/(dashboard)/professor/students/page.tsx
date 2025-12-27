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
import { GraduationCap } from "lucide-react";

async function getProfessorStudents() {
  const { userId } = await auth();
  if (!userId) return { students: [], classMap: new Map() };

  await connectDB();
  const professor = await User.findOne({ clerkId: userId, isActive: true });
  if (!professor) return { students: [], classMap: new Map() };

  // Get professor's offerings
  const offerings = await SubjectOffering.find({ professorId: professor._id, isActive: true })
    .populate("classId", "name")
    .lean();

  const classIds = [...new Set(offerings.map(o => o.classId._id.toString()))];
  const classMap = new Map(offerings.map(o => [o.classId._id.toString(), (o.classId as { name: string }).name]));

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
  const alas = await ALA.find({ professorId: professor._id, isActive: true }).select("_id");
  const alaIds = alas.map(a => a._id);

  // Get submission stats for each student
  const studentStats = await Promise.all(
    students.map(async (student) => {
      const [submitted, graded] = await Promise.all([
        Submission.countDocuments({ 
          studentId: student._id, 
          alaId: { $in: alaIds },
          status: { $in: ["submitted", "graded"] }
        }),
        Submission.countDocuments({ 
          studentId: student._id, 
          alaId: { $in: alaIds },
          status: "graded"
        }),
      ]);

      // Calculate average marks
      const gradedSubmissions = await Submission.find({
        studentId: student._id,
        alaId: { $in: alaIds },
        status: "graded",
      }).populate("alaId", "maxMarks").lean();

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
        className: student.classId ? classMap.get(student.classId.toString()) || "Unknown" : "Unknown",
        submitted,
        graded,
        avgPercentage,
      };
    })
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

  return (
    <DashboardLayout role="professor" user={user} breadcrumbs={[{ label: "Professor" }, { label: "Students" }]}>
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Students</h2>
            <p className="text-muted-foreground">Students in your classes</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <GraduationCap className="mr-2 h-4 w-4" />
            {students.length} Students
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
            <CardDescription>View student performance and submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students in your classes</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-center">Submitted</TableHead>
                    <TableHead className="text-center">Graded</TableHead>
                    <TableHead className="text-center">Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: {
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
                    <TableRow key={student._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.profileImage} />
                            <AvatarFallback>
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.className}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{student.submitted}</TableCell>
                      <TableCell className="text-center">{student.graded}</TableCell>
                      <TableCell className="text-center">
                        {student.graded > 0 ? (
                          <Badge 
                            variant={student.avgPercentage >= 70 ? "default" : student.avgPercentage >= 50 ? "secondary" : "destructive"}
                          >
                            {student.avgPercentage}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
