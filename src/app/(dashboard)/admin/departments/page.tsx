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
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CheckCircle2,
  XCircle,
  UserCheck,
  TrendingUp,
} from "lucide-react";

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

  const activeDepts = departments.filter(
    (d: { isActive: boolean }) => d.isActive
  ).length;
  const inactiveDepts = departments.length - activeDepts;
  const withHod = departments.filter(
    (d: { hodId: unknown }) => d.hodId
  ).length;

  const statCards = [
    {
      title: "Total Departments",
      value: departments.length,
      icon: Building2,
      color: "blue",
      badge: activeDepts > 0 ? "Active" : null,
    },
    {
      title: "Active",
      value: activeDepts,
      icon: CheckCircle2,
      color: "emerald",
      badge: null,
    },
    {
      title: "Inactive",
      value: inactiveDepts,
      icon: XCircle,
      color: "amber",
      badge: null,
    },
    {
      title: "With HOD",
      value: withHod,
      icon: UserCheck,
      color: "violet",
      badge: withHod === departments.length ? "All Assigned" : null,
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
      role="admin"
      user={user}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Departments" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Departments</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {departments.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Manage academic departments and assign HODs
            </p>
          </div>
          <CreateDepartmentDialog hods={hods} />
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
                  {stat.badge && (
                    <Badge
                      variant="outline"
                      className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    >
                      {stat.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>All Departments</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <DepartmentsTable departments={departments} hods={hods} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
