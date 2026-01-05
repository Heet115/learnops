import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  getAllClassCoordinators,
  getAllClasses,
  getAvailableProfessors,
} from "@/lib/actions/academic.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { ClassCoordinatorsTable } from "@/components/admin/class-coordinators-table";
import { AssignCoordinatorDialog } from "@/components/admin/assign-coordinator-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown } from "lucide-react";

export default async function ClassCoordinatorsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [coordinators, classes, professors, dbUser] = await Promise.all([
    getAllClassCoordinators(),
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
        { label: "Class Coordinators" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Class Coordinators</h2>
            <p className="text-muted-foreground">
              Assign professors as class coordinators (CC)
            </p>
          </div>
          <AssignCoordinatorDialog classes={classes} professors={professors} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Coordinators
              </CardTitle>
              <Crown className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coordinators.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Class Coordinators</CardTitle>
          </CardHeader>
          <CardContent>
            <ClassCoordinatorsTable
              coordinators={coordinators}
              professors={professors}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
