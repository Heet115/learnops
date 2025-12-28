import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getAllUpdateRequests } from "@/lib/actions/student-profile.actions";
import { ProfileRequestsTable } from "@/components/admin/profile-requests-table";

export default async function ProfileRequestsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const [dbUser, requests] = await Promise.all([
    getCurrentUserFromDB(),
    getAllUpdateRequests(),
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
        { label: "Profile Requests" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">Profile Update Requests</h2>
          <p className="text-muted-foreground">
            Review and approve student profile update requests
          </p>
        </div>

        <ProfileRequestsTable requests={requests} />
      </div>
    </DashboardLayout>
  );
}
