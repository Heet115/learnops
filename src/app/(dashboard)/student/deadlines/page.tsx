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
import { Clock, Calendar, CheckCircle, AlertTriangle } from "lucide-react";

async function getStudentDeadlines() {
  const { userId } = await auth();
  if (!userId) return { upcoming: [], overdue: [], completed: [] };

  await connectDB();
  const student = await User.findOne({ clerkId: userId, isActive: true });
  if (!student || !student.classId)
    return { upcoming: [], overdue: [], completed: [] };

  // Get offerings for student's class
  const offerings = await SubjectOffering.find({
    classId: student.classId,
    isActive: true,
  }).select("_id");
  const offeringIds = offerings.map((o) => o._id);

  // Get all ALAs
  const alas = await ALA.find({
    subjectOfferingId: { $in: offeringIds },
    isActive: true,
  })
    .populate({
      path: "subjectOfferingId",
      select: "subjectId",
      populate: { path: "subjectId", select: "name code" },
    })
    .sort({ deadline: 1 })
    .lean();

  // Get student's submissions
  const submissions = await Submission.find({
    studentId: student._id,
    status: { $in: ["submitted", "graded"] },
  })
    .select("alaId")
    .lean();

  const submittedAlaIds = new Set(submissions.map((s) => s.alaId.toString()));
  const now = new Date();

  const upcoming: typeof alas = [];
  const overdue: typeof alas = [];
  const completed: typeof alas = [];

  for (const ala of alas) {
    const isSubmitted = submittedAlaIds.has(ala._id.toString());
    const deadline = new Date(ala.deadline);

    if (isSubmitted) {
      completed.push(ala);
    } else if (deadline < now) {
      overdue.push(ala);
    } else {
      upcoming.push(ala);
    }
  }

  return {
    upcoming: JSON.parse(JSON.stringify(upcoming)),
    overdue: JSON.parse(JSON.stringify(overdue)),
    completed: JSON.parse(JSON.stringify(completed)),
  };
}

export default async function StudentDeadlinesPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, deadlines] = await Promise.all([
    getCurrentUserFromDB(),
    getStudentDeadlines(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (days > 0 && days <= 7) return `${days} days left`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDate = (deadline: string) => {
    return new Date(deadline).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[{ label: "Student" }, { label: "Deadlines" }]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">Deadlines</h2>
          <p className="text-muted-foreground">Track your ALA deadlines</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-blue-500" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {deadlines.upcoming.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {deadlines.overdue.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {deadlines.completed.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {deadlines.overdue.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Overdue ALAs
              </CardTitle>
              <CardDescription>These deadlines have passed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deadlines.overdue.map(
                  (ala: {
                    _id: string;
                    title: string;
                    deadline: string;
                    isLocked: boolean;
                    subjectOfferingId?: { subjectId?: { code: string } };
                  }) => (
                    <Link
                      key={ala._id}
                      href={`/student/alas/${ala._id}`}
                      className="flex items-center justify-between rounded-lg border border-red-100 p-3 transition-colors hover:bg-red-50"
                    >
                      <div>
                        <p className="font-medium">{ala.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {ala.subjectOfferingId?.subjectId?.code} •{" "}
                          {formatDate(ala.deadline)}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {ala.isLocked ? "Locked" : "Overdue"}
                      </Badge>
                    </Link>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>ALAs you need to submit</CardDescription>
          </CardHeader>
          <CardContent>
            {deadlines.upcoming.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No upcoming deadlines
              </p>
            ) : (
              <div className="space-y-3">
                {deadlines.upcoming.map(
                  (ala: {
                    _id: string;
                    title: string;
                    deadline: string;
                    maxMarks: number;
                    subjectOfferingId?: {
                      subjectId?: { code: string; name: string };
                    };
                  }) => {
                    const deadlineText = formatDeadline(ala.deadline);
                    const isUrgent =
                      deadlineText.includes("today") ||
                      deadlineText.includes("tomorrow") ||
                      deadlineText.includes("days left");

                    return (
                      <Link
                        key={ala._id}
                        href={`/student/alas/${ala._id}`}
                        className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{ala.title}</p>
                          <p className="text-muted-foreground text-sm">
                            {ala.subjectOfferingId?.subjectId?.code} •{" "}
                            {ala.maxMarks} marks
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={isUrgent ? "destructive" : "secondary"}
                          >
                            {deadlineText}
                          </Badge>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {formatDate(ala.deadline)}
                          </p>
                        </div>
                      </Link>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
