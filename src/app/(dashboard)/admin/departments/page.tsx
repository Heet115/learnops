import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  getAllDepartments,
  getAvailableHODs,
} from "@/lib/actions/academic.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { DepartmentsTable } from "@/components/admin/departments-table";
import { CreateDepartmentDialog } from "@/components/admin/create-department-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default async function DepartmentsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [departments, hods, dbUser] = await Promise.all([
    getAllDepartments(),
    getAvailableHODs(),
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
        { label: "Departments" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Departments</h2>
            <p className="text-muted-foreground">Manage academic departments</p>
          </div>
          <CreateDepartmentDialog hods={hods} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Departments
              </CardTitle>
              <Building2 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentsTable departments={departments} hods={hods} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
