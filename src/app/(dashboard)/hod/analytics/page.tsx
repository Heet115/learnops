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

  return (
    <DashboardLayout
      role="hod"
      user={user}
      breadcrumbs={[{ label: "HOD" }, { label: "Analytics" }]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">Department Analytics</h2>
          <p className="text-muted-foreground">
            Monitor submissions, professor activity, and completion rates
          </p>
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
