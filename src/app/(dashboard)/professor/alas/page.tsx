import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getALAsByProfessor, getProfessorSubjectOfferings } from "@/lib/actions/ala.actions";
import { ALAsTable } from "@/components/professor/alas-table";
import { CreateALADialog } from "@/components/professor/create-ala-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Lock, CheckCircle } from "lucide-react";

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
  const activeCount = alas.filter((a: { deadline: string; isLocked: boolean }) => 
    new Date(a.deadline) > now && !a.isLocked
  ).length;
  const pastDeadline = alas.filter((a: { deadline: string }) => 
    new Date(a.deadline) <= now
  ).length;
  const lockedCount = alas.filter((a: { isLocked: boolean }) => a.isLocked).length;

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[{ label: "Professor", href: "/professor" }, { label: "ALAs" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Active Learning Activities</h2>
            <p className="text-muted-foreground">Create and manage ALAs for your subjects</p>
          </div>
          <CreateALADialog offerings={offerings} />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total ALAs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alas.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Past Deadline</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pastDeadline}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Locked</CardTitle>
              <Lock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lockedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All ALAs</CardTitle>
          </CardHeader>
          <CardContent>
            <ALAsTable alas={alas} offerings={offerings} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
