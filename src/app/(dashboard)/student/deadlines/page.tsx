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
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

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

  const statCards = [
    {
      title: "Upcoming",
      value: deadlines.upcoming.length,
      icon: Clock,
      color: "blue",
    },
    {
      title: "Overdue",
      value: deadlines.overdue.length,
      icon: AlertTriangle,
      color: "rose",
    },
    {
      title: "Completed",
      value: deadlines.completed.length,
      icon: CheckCircle,
      color: "emerald",
    },
  ];

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[{ label: "Student" }, { label: "Deadlines" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Deadlines</h2>
              <Badge variant="secondary" className="text-sm">
                {deadlines.upcoming.length + deadlines.overdue.length} Active
              </Badge>
            </div>
            <p className="text-muted-foreground">Track your ALA deadlines</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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

        {deadlines.overdue.length > 0 && (
          <Card className="border-rose-500/30">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <CardTitle className="text-rose-600">Overdue ALAs</CardTitle>
                  <CardDescription>These deadlines have passed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
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
                      className="group/item flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 transition-colors hover:bg-rose-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
                          <FileText className="h-4 w-4 text-rose-600" />
                        </div>
                        <div>
                          <p className="font-medium">{ala.title}</p>
                          <p className="text-muted-foreground text-sm">
                            {ala.subjectOfferingId?.subjectId?.code} •{" "}
                            {formatDate(ala.deadline)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-rose-500/30 bg-rose-500/10 text-rose-600"
                      >
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
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
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-4 w-4" />
              </div>
              <div>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>ALAs you need to submit</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {deadlines.upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                  <Calendar className="text-muted-foreground h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-medium">
                  No upcoming deadlines
                </p>
                <p className="text-muted-foreground text-sm">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
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
                        className="group/item bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${isUrgent ? "bg-amber-500/10" : "bg-blue-500/10"}`}
                          >
                            <FileText
                              className={`h-4 w-4 ${isUrgent ? "text-amber-600" : "text-blue-600"}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{ala.title}</p>
                            <p className="text-muted-foreground text-sm">
                              {ala.subjectOfferingId?.subjectId?.code} •{" "}
                              {ala.maxMarks} marks
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              isUrgent
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                                : "border-blue-500/30 bg-blue-500/10 text-blue-600"
                            }
                          >
                            <span
                              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${isUrgent ? "bg-amber-500" : "bg-blue-500"}`}
                            />
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
