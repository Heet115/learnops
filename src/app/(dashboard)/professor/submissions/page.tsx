import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getProfessorSubmissions,
  getProfessorGradingStats,
} from "@/lib/actions/grading.actions";
import { SubmissionsTable } from "@/components/professor/submissions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ClipboardList,
} from "lucide-react";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProfessorSubmissionsPage({
  searchParams,
}: PageProps) {
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

  const statCards = [
    {
      title: "Total Submissions",
      value: stats.total,
      icon: FileText,
      color: "blue",
    },
    {
      title: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "amber",
    },
    {
      title: "Graded",
      value: stats.graded,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "rose",
    },
  ];

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[
        { label: "Professor", href: "/professor" },
        { label: "Submissions" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Student Submissions</h2>
              <Badge variant="secondary" className="text-sm">
                {stats.total} Total
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Review and grade student work
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
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <ClipboardList className="text-primary h-4 w-4" />
              </div>
              <CardTitle>All Submissions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue={status || "pending"} className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="graded">
                  Graded ({stats.graded})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({stats.rejected})
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              <TabsContent value="pending">
                <SubmissionsTable
                  submissions={submissions.filter(
                    (s: { status: string }) => s.status === "submitted",
                  )}
                />
              </TabsContent>
              <TabsContent value="graded">
                <SubmissionsTable
                  submissions={submissions.filter(
                    (s: { status: string }) => s.status === "graded",
                  )}
                />
              </TabsContent>
              <TabsContent value="rejected">
                <SubmissionsTable
                  submissions={submissions.filter(
                    (s: { status: string }) => s.status === "rejected",
                  )}
                />
              </TabsContent>
              <TabsContent value="all">
                <SubmissionsTable submissions={submissions} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
