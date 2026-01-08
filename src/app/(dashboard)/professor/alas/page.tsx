import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getALAsByProfessor,
  getProfessorSubjectOfferings,
} from "@/lib/actions/ala.actions";
import { ALAsTable } from "@/components/professor/alas-table";
import { CreateALADialog } from "@/components/professor/create-ala-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Lock, CheckCircle, TrendingUp } from "lucide-react";

export default async function ProfessorALAsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const [dbUser, alas, offerings] = await Promise.all([
    getCurrentUserFromDB(),
    getALAsByProfessor(),
    getProfessorSubjectOfferings(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const now = new Date();
  const activeCount = alas.filter(
    (a: { deadline: string; isLocked: boolean }) =>
      new Date(a.deadline) > now && !a.isLocked
  ).length;
  const pastDeadline = alas.filter(
    (a: { deadline: string }) => new Date(a.deadline) <= now
  ).length;
  const lockedCount = alas.filter(
    (a: { isLocked: boolean }) => a.isLocked
  ).length;

  const statCards = [
    {
      title: "Total ALAs",
      value: alas.length,
      icon: FileText,
      color: "blue",
    },
    {
      title: "Active",
      value: activeCount,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      title: "Past Deadline",
      value: pastDeadline,
      icon: Clock,
      color: "amber",
    },
    {
      title: "Locked",
      value: lockedCount,
      icon: Lock,
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
      role="professor"
      user={user}
      breadcrumbs={[
        { label: "Professor", href: "/professor" },
        { label: "ALAs" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Active Learning Activities</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {alas.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Create and manage ALAs for your subjects
            </p>
          </div>
          <CreateALADialog offerings={offerings} />
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

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>All ALAs</CardTitle>
                <CardDescription>
                  Manage your active learning activities
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ALAsTable alas={alas} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
