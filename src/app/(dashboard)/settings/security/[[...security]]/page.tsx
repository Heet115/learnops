import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { SecuritySettings } from "@/components/layout/security-settings";

export default async function SecuritySettingsPage() {
  const { sessionClaims } = await auth();
  const role =
    (sessionClaims?.metadata as { role?: string })?.role || "student";

  const dbUser = await getCurrentUserFromDB();

  if (!dbUser) {
    redirect("/sign-in");
  }

  const user = {
    name: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || "User",
    email: dbUser.email || "",
    avatar: dbUser.profileImage,
  };

  return (
    <DashboardLayout
      role={role as "admin" | "hod" | "professor" | "student"}
      user={user}
      breadcrumbs={[
        { label: "Settings", href: `/${role}` },
        { label: "Security" },
      ]}
    >
      <div className="flex justify-center">
        <SecuritySettings />
      </div>
    </DashboardLayout>
  );
}
