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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookMarked } from "lucide-react";

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

  return (
    <DashboardLayout
      role="hod"
      user={user}
      breadcrumbs={[{ label: "HOD" }, { label: "Subjects" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Subjects</h2>
            <p className="text-muted-foreground">
              All subjects in your department
            </p>
          </div>
          <Badge variant="secondary" className="px-4 py-2 text-lg">
            <BookMarked className="mr-2 h-4 w-4" />
            {subjects.length} Subjects
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subjects</CardTitle>
            <CardDescription>
              View subject details and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No subjects found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead className="text-center">Offerings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map(
                    (sub: {
                      _id: string;
                      name: string;
                      code: string;
                      credits: number;
                      offeringCount: number;
                      semesterId?: {
                        name: string;
                        number: number;
                        courseId?: { name: string; code: string };
                      };
                    }) => (
                      <TableRow key={sub._id}>
                        <TableCell>
                          <Badge variant="outline">{sub.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {sub.name}
                        </TableCell>
                        <TableCell>
                          {sub.semesterId?.courseId?.code || "N/A"}
                        </TableCell>
                        <TableCell>{sub.semesterId?.name || "N/A"}</TableCell>
                        <TableCell className="text-center">
                          {sub.credits}
                        </TableCell>
                        <TableCell className="text-center">
                          {sub.offeringCount > 0 ? (
                            <Badge variant="secondary">
                              {sub.offeringCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
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
