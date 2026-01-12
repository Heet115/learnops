import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Cloud, Shield, Bell } from "lucide-react";

export default async function AdminSettingsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  const dbUser = await getCurrentUserFromDB();

  const user = {
    name: `${dbUser?.firstName || "Admin"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const systemInfo = [
    {
      title: "Database",
      description: "MongoDB Atlas (Free M0)",
      icon: Database,
      status: "Connected",
      statusColor: "bg-green-500",
    },
    {
      title: "File Storage",
      description: "Cloudinary (Free Tier)",
      icon: Cloud,
      status: "Active",
      statusColor: "bg-green-500",
    },
    {
      title: "Authentication",
      description: "Clerk (Free Plan)",
      icon: Shield,
      status: "Active",
      statusColor: "bg-green-500",
    },
    {
      title: "Notifications",
      description: "In-app notifications",
      icon: Bell,
      status: "Enabled",
      statusColor: "bg-green-500",
    },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[{ label: "Admin" }, { label: "Settings" }]}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Settings</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            System configuration and information
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {systemInfo.map((info) => (
            <Card key={info.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                    <info.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{info.title}</CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${info.statusColor}`}
                  />
                  <span className="text-muted-foreground text-sm">
                    {info.status}
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>LearnOps platform details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium">LearnOps</span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground">Version</span>
                <Badge variant="secondary">1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground">Framework</span>
                <span className="font-medium">Next.js 16</span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground">UI Library</span>
                <span className="font-medium">React 19</span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground">Styling</span>
                <span className="font-medium">Tailwind CSS 4</span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground">File Size Limit</span>
                <span className="font-medium">30 MB</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">
                  Allowed File Types
                </span>
                <div className="flex gap-1">
                  {["PDF", "DOCX", "PPT", "ZIP"].map((type) => (
                    <Badge key={type} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h4 className="mb-1 font-medium">Deadline Reminders</h4>
                <p className="text-muted-foreground mb-3 text-sm">
                  Send deadline reminders to students with upcoming ALAs
                </p>
                <Badge variant="secondary">Automated (24hr before)</Badge>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="mb-1 font-medium">Auto-Lock Submissions</h4>
                <p className="text-muted-foreground mb-3 text-sm">
                  Submissions are automatically locked after deadline
                </p>
                <Badge variant="secondary">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
