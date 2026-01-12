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
import { Badge } from "@/components/ui/badge";
import { UserCircle } from "lucide-react";

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

  const pendingRequests = updateRequests.filter(
    (r: { requestStatus: string }) => r.requestStatus === "pending",
  ).length;

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
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <UserCircle className="text-muted-foreground h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Profile Not Found</h2>
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold sm:text-2xl">My Profile</h2>
              {pendingRequests > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                >
                  {pendingRequests} Pending Request
                  {pendingRequests > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              View your profile information. Contact admin to request changes.
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              Update Requests
              {pendingRequests > 0 && (
                <Badge className="bg-primary text-primary-foreground h-5 min-w-5 rounded-full px-1.5 text-xs">
                  {pendingRequests}
                </Badge>
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
