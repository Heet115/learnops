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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users } from "lucide-react";

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

  return (
    <DashboardLayout
      role="hod"
      user={user}
      breadcrumbs={[{ label: "HOD" }, { label: "Classes" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Classes</h2>
            <p className="text-muted-foreground">
              All sections in your department
            </p>
          </div>
          <Badge variant="secondary" className="px-4 py-2 text-lg">
            <GraduationCap className="mr-2 h-4 w-4" />
            {classes.length} Classes
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Classes</CardTitle>
            <CardDescription>
              View class details and student enrollment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No classes found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Subjects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map(
                    (cls: {
                      _id: string;
                      name: string;
                      academicYear: string;
                      studentCount: number;
                      subjectCount: number;
                      semesterId?: {
                        name: string;
                        number: number;
                        courseId?: { name: string; code: string };
                      };
                    }) => (
                      <TableRow key={cls._id}>
                        <TableCell className="font-medium">
                          {cls.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {cls.semesterId?.courseId?.code || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{cls.semesterId?.name || "N/A"}</TableCell>
                        <TableCell>{cls.academicYear}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="text-muted-foreground h-4 w-4" />
                            {cls.studentCount}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {cls.subjectCount}
                        </TableCell>
                      </TableRow>
                    ),
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
