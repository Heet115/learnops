import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getMyProfile,
  getMyUpdateRequests,
} from "@/lib/actions/student-profile.actions";
import { StudentProfileView } from "@/components/student/student-profile-view";
import { ProfileUpdateRequests } from "@/components/student/profile-update-requests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function StudentProfilePage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, profileResult, updateRequests] = await Promise.all([
    getCurrentUserFromDB(),
    getMyProfile(),
    getMyUpdateRequests(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  if (!profileResult.success || !profileResult.data) {
    return (
      <DashboardLayout
        role="student"
        user={user}
        breadcrumbs={[
          { label: "Student", href: "/student" },
          { label: "Profile" },
        ]}
      >
        <div className="pt-4">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-lg font-semibold">Profile Not Found</h2>
            <p className="text-muted-foreground mt-2">
              Your profile has not been set up yet. Please contact the
              administrator.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[
        { label: "Student", href: "/student" },
        { label: "Profile" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">My Profile</h2>
          <p className="text-muted-foreground">
            View your profile information. Contact admin to request changes.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="requests">
              Update Requests
              {updateRequests.filter(
                (r: { requestStatus: string }) => r.requestStatus === "pending",
              ).length > 0 && (
                <span className="bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs">
                  {
                    updateRequests.filter(
                      (r: { requestStatus: string }) =>
                        r.requestStatus === "pending",
                    ).length
                  }
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <StudentProfileView data={profileResult.data} />
          </TabsContent>

          <TabsContent value="requests">
            <ProfileUpdateRequests requests={updateRequests} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
