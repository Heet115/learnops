import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getSubmissionTrends,
  getProfessorActivity,
  getSubmissionsByClass,
  getSubjectCompletion,
  getSubmissionHeatmap,
  getALAStatusOverview,
} from "@/lib/actions/hod-analytics.actions";
import { SubmissionTrendsChart } from "@/components/hod/submission-trends-chart";
import { ProfessorActivityChart } from "@/components/hod/professor-activity-chart";
import { ClassSubmissionsTable } from "@/components/hod/class-submissions-table";
import { SubjectCompletionChart } from "@/components/hod/subject-completion-chart";
import { SubmissionHeatmap } from "@/components/hod/submission-heatmap";
import { ALAStatusTable } from "@/components/hod/ala-status-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  FileCheck,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default async function HodAnalyticsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "hod") {
    redirect("/unauthorized");
  }

  const [
    dbUser,
    submissionTrends,
    professorActivity,
    classSubs,
    subjectCompletion,
    heatmapData,
    alaStatus,
  ] = await Promise.all([
    getCurrentUserFromDB(),
    getSubmissionTrends(),
    getProfessorActivity(),
    getSubmissionsByClass(),
    getSubjectCompletion(),
    getSubmissionHeatmap(),
    getALAStatusOverview(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "HOD"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  // Calculate summary stats
  const totalSubmissions = submissionTrends.reduce(
    (acc: number, curr: { submitted: number }) => acc + curr.submitted,
    0
  );
  const totalGraded = submissionTrends.reduce(
    (acc: number, curr: { graded: number }) => acc + curr.graded,
    0
  );
  const totalPending = professorActivity.reduce(
    (acc: number, curr: { pending: number }) => acc + curr.pending,
    0
  );
  const avgCompletion =
    subjectCompletion.length > 0
      ? Math.round(
          subjectCompletion.reduce(
            (acc: number, curr: { completionRate: number }) =>
              acc + curr.completionRate,
            0
          ) / subjectCompletion.length
        )
      : 0;

  const statCards = [
    {
      title: "Total Submissions",
      value: totalSubmissions,
      icon: FileCheck,
      color: "blue",
    },
    {
      title: "Graded",
      value: totalGraded,
      icon: CheckCircle2,
      color: "emerald",
    },
    {
      title: "Pending Review",
      value: totalPending,
      icon: Clock,
      color: "amber",
    },
    {
      title: "Avg Completion",
      value: `${avgCompletion}%`,
      icon: TrendingUp,
      color: "violet",
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
      role="hod"
      user={user}
      breadcrumbs={[{ label: "HOD" }, { label: "Analytics" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Department Analytics</h2>
              <Badge variant="secondary" className="gap-1">
                <BarChart3 className="h-3 w-3" />
                Reports
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Monitor submissions, professor activity, and completion rates
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

        {/* Submission Trends */}
        <SubmissionTrendsChart data={submissionTrends} />

        {/* Professor Activity & Subject Completion */}
        <div className="grid gap-4 md:grid-cols-2">
          <ProfessorActivityChart data={professorActivity} />
          <SubjectCompletionChart data={subjectCompletion} />
        </div>

        {/* Submission Heatmap */}
        <SubmissionHeatmap data={heatmapData} />

        {/* Class Submissions Table */}
        <ClassSubmissionsTable data={classSubs} />

        {/* ALA Status */}
        <ALAStatusTable data={alaStatus} />
      </div>
    </DashboardLayout>
  );
}
