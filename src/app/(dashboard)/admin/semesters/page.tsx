import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getAllSemesters, getAllCourses } from "@/lib/actions/academic.actions";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { SemestersTable } from "@/components/admin/semesters-table";
import { CreateSemesterDialog } from "@/components/admin/create-semester-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Layers,
  TrendingUp,
} from "lucide-react";

export default async function SemestersPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [semesters, courses, dbUser] = await Promise.all([
    getAllSemesters(),
    getAllCourses(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Admin"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const activeSemesters = semesters.filter(
    (s: { isActive: boolean }) => s.isActive,
  ).length;
  const inactiveSemesters = semesters.length - activeSemesters;

  // Count unique courses that have semesters
  const uniqueCourses = new Set(
    semesters.map((s: { courseId?: { _id: unknown } }) =>
      s.courseId?._id?.toString(),
    ),
  ).size;

  const statCards = [
    {
      title: "Total Semesters",
      value: semesters.length,
      icon: Calendar,
      color: "blue",
      badge: activeSemesters > 0 ? "Active" : null,
    },
    {
      title: "Active",
      value: activeSemesters,
      icon: CheckCircle2,
      color: "emerald",
      badge: null,
    },
    {
      title: "Inactive",
      value: inactiveSemesters,
      icon: XCircle,
      color: "amber",
      badge: null,
    },
    {
      title: "Courses Covered",
      value: uniqueCourses,
      icon: Layers,
      color: "violet",
      badge: null,
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
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Semesters" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Semesters</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {semesters.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Manage academic semesters and their schedules
            </p>
          </div>
          <CreateSemesterDialog courses={courses} />
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
                      className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600"
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
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-4 w-4" />
              </div>
              <CardTitle>All Semesters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <SemestersTable semesters={semesters} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
