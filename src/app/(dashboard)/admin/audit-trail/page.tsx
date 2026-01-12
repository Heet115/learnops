import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getAdminAuditTrail } from "@/lib/actions/activity.actions";
import { ActivityLog } from "@/components/activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScrollText,
  Users,
  FileText,
  Building2,
  TrendingUp,
} from "lucide-react";

export default async function AuditTrailPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [dbUser, auditData] = await Promise.all([
    getCurrentUserFromDB(),
    getAdminAuditTrail({ limit: 100 }),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Admin"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  // Count activities by entity type
  const userActions = auditData.activities.filter(
    (a: { entityType: string }) => a.entityType === "user",
  ).length;
  const academicActions = auditData.activities.filter(
    (a: { entityType: string }) =>
      [
        "department",
        "course",
        "semester",
        "subject",
        "class",
        "subject_offering",
      ].includes(a.entityType),
  ).length;
  const alaActions = auditData.activities.filter((a: { entityType: string }) =>
    ["ala", "submission", "group"].includes(a.entityType),
  ).length;

  const statCards = [
    {
      title: "Total Actions",
      value: auditData.pagination.total,
      icon: ScrollText,
      color: "blue",
      badge: auditData.activities.length > 0 ? "Recent" : null,
    },
    {
      title: "User Actions",
      value: userActions,
      icon: Users,
      color: "emerald",
      badge: null,
    },
    {
      title: "Academic Actions",
      value: academicActions,
      icon: Building2,
      color: "amber",
      badge: null,
    },
    {
      title: "ALA Actions",
      value: alaActions,
      icon: FileText,
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
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Audit Trail" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">Audit Trail</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {auditData.pagination.total} total
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Track all administrative actions in the system
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
                      className="border-blue-500/30 bg-blue-500/10 text-xs text-blue-600"
                    >
                      {stat.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ActivityLog
          activities={auditData.activities}
          title="Administrative Actions"
          description={`${auditData.pagination.total} total actions recorded`}
          showExport
          pageSize={20}
        />
      </div>
    </DashboardLayout>
  );
}
