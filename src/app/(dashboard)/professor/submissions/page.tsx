import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getProfessorSubmissions, getProfessorGradingStats } from "@/lib/actions/grading.actions";
import { SubmissionsTable } from "@/components/professor/submissions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProfessorSubmissionsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const [dbUser, submissions, stats] = await Promise.all([
    getCurrentUserFromDB(),
    getProfessorSubmissions(status),
    getProfessorGradingStats(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[{ label: "Professor", href: "/professor" }, { label: "Submissions" }]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">Student Submissions</h2>
          <p className="text-muted-foreground">Review and grade student work</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Graded</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={status || "pending"} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({stats.graded})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            <SubmissionsTable 
              submissions={submissions.filter((s: { status: string }) => s.status === "submitted")} 
            />
          </TabsContent>
          <TabsContent value="graded">
            <SubmissionsTable 
              submissions={submissions.filter((s: { status: string }) => s.status === "graded")} 
            />
          </TabsContent>
          <TabsContent value="rejected">
            <SubmissionsTable 
              submissions={submissions.filter((s: { status: string }) => s.status === "rejected")} 
            />
          </TabsContent>
          <TabsContent value="all">
            <SubmissionsTable submissions={submissions} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
