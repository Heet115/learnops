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
import { BookMarked, Users, FileText, ArrowRight } from "lucide-react";

async function getProfessorSubjects() {
  const { userId } = await auth();
  if (!userId) return [];

  await connectDB();
  const professor = await User.findOne({ clerkId: userId, isActive: true });
  if (!professor) return [];

  const offerings = await SubjectOffering.find({ professorId: professor._id, isActive: true })
    .populate("subjectId", "name code credits")
    .populate("classId", "name academicYear")
    .populate("semesterId", "name number")
    .lean();

  // Get stats for each offering
  const offeringStats = await Promise.all(
    offerings.map(async (off) => {
      const alas = await ALA.find({ subjectOfferingId: off._id, isActive: true }).select("_id");
      const alaIds = alas.map(a => a._id);

      const [studentCount, pending] = await Promise.all([
        User.countDocuments({ role: "student", classId: off.classId, isActive: true }),
        Submission.countDocuments({ alaId: { $in: alaIds }, status: "submitted" }),
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

  return (
    <DashboardLayout role="professor" user={user} breadcrumbs={[{ label: "Professor" }, { label: "My Subjects" }]}>
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Subjects</h2>
            <p className="text-muted-foreground">Subjects assigned to you this semester</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <BookMarked className="mr-2 h-4 w-4" />
            {subjects.length} Subjects
          </Badge>
        </div>

        {subjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookMarked className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No subjects assigned yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((offering: {
              _id: string;
              academicYear: string;
              alaCount: number;
              studentCount: number;
              pending: number;
              subjectId?: { name: string; code: string; credits: number };
              classId?: { name: string; academicYear: string };
              semesterId?: { name: string; number: number };
            }) => (
              <Card key={offering._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline">{offering.subjectId?.code}</Badge>
                    {offering.pending > 0 && (
                      <Badge variant="destructive">{offering.pending} pending</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2">{offering.subjectId?.name}</CardTitle>
                  <CardDescription>
                    {offering.classId?.name} • {offering.semesterId?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" /> Students
                      </span>
                      <span className="font-medium">{offering.studentCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" /> ALAs Created
                      </span>
                      <span className="font-medium">{offering.alaCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credits</span>
                      <span className="font-medium">{offering.subjectId?.credits}</span>
                    </div>
                    <Button variant="outline" className="w-full mt-2" asChild>
                      <Link href={`/professor/alas?subject=${offering._id}`}>
                        View ALAs <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
