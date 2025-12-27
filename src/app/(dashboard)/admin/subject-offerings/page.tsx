import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  getAllSubjectOfferings,
  getAllSemesters,
  getAllSubjects,
  getAllClasses,
  getAvailableProfessors,
} from "@/lib/actions/academic.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { SubjectOfferingsTable } from "@/components/admin/subject-offerings-table";
import { CreateSubjectOfferingDialog } from "@/components/admin/create-subject-offering-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default async function SubjectOfferingsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [offerings, semesters, subjects, classes, professors, dbUser] =
    await Promise.all([
      getAllSubjectOfferings(),
      getAllSemesters(),
      getAllSubjects(),
      getAllClasses(),
      getAvailableProfessors(),
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
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Subject Offerings" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Subject Offerings</h2>
            <p className="text-muted-foreground">
              Assign professors to subjects and classes
            </p>
          </div>
          <CreateSubjectOfferingDialog
            semesters={semesters}
            subjects={subjects}
            classes={classes}
            professors={professors}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assignments
              </CardTitle>
              <BookOpen className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{offerings.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subject Offerings</CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectOfferingsTable
              offerings={offerings}
              professors={professors}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
