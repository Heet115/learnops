import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Redirect to role-specific dashboard
  if (role === "admin") redirect("/admin");
  if (role === "hod") redirect("/hod");
  if (role === "professor") redirect("/professor");
  if (role === "student") redirect("/student");

  // Fallback if no role assigned
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.firstName || "User"}!
        </h1>
        <p className="text-muted-foreground">
          Your account has not been assigned a role yet.
        </p>
        <p className="text-muted-foreground text-sm">
          Please contact your administrator.
        </p>
      </div>
    </div>
  );
}
