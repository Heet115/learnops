import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  getAllSubjects,
  getAllSemesters,
} from "@/lib/actions/academic.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { SubjectsTable } from "@/components/admin/subjects-table";
import { CreateSubjectDialog } from "@/components/admin/create-subject-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookMarked } from "lucide-react";

export default async function SubjectsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [subjects, semesters, dbUser] = await Promise.all([
    getAllSubjects(),
    getAllSemesters(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Admin"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Subjects" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Subjects</h2>
            <p className="text-muted-foreground">Manage academic subjects</p>
          </div>
          <CreateSubjectDialog semesters={semesters} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Subjects
              </CardTitle>
              <BookMarked className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectsTable subjects={subjects} semesters={semesters} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
