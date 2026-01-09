import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getNotificationPreferences } from "@/lib/actions/notification-preferences.actions";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";

export default async function StudentNotificationSettingsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, preferences] = await Promise.all([
    getCurrentUserFromDB(),
    getNotificationPreferences(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  // Default preferences if none exist
  const defaultPreferences = {
    newAla: true,
    deadlineReminder: true,
    submissionGraded: true,
    submissionRejected: true,
    systemNotifications: true,
    inApp: true,
    deadlineReminderHours: 24,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  };

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[
        { label: "Student" },
        { label: "Notifications", href: "/student/notifications" },
        { label: "Settings" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Notification Settings</h2>
          <p className="text-muted-foreground">
            Customize how and when you receive notifications
          </p>
        </div>

        <div className="max-w-2xl">
          <NotificationPreferencesForm
            preferences={preferences || defaultPreferences}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
