import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getAdminAuditTrail } from "@/lib/actions/activity.actions";
import { ActivityLog } from "@/components/activity";
import { FadeIn } from "@/components/ui/page-transition";

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

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Audit Trail" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <FadeIn>
          <div>
            <h2 className="text-2xl font-bold">Audit Trail</h2>
            <p className="text-muted-foreground">
              Track all administrative actions in the system
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <ActivityLog
            activities={auditData.activities}
            title="Administrative Actions"
            description={`${auditData.pagination.total} total actions recorded`}
            showExport
            pageSize={20}
          />
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
