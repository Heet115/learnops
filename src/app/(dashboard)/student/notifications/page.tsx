import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getNotifications } from "@/lib/actions/notification.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, FileText, Clock, Award, XCircle } from "lucide-react";
import { NotificationActions } from "@/components/student/notification-actions";

export default async function StudentNotificationsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, notifications] = await Promise.all([
    getCurrentUserFromDB(),
    getNotifications(50),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_ala":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "deadline_reminder":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "submission_graded":
        return <Award className="h-5 w-5 text-green-500" />;
      case "submission_rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "new_ala":
        return <Badge variant="default">New ALA</Badge>;
      case "deadline_reminder":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Deadline</Badge>;
      case "submission_graded":
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Graded</Badge>;
      case "submission_rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">System</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getLink = (notification: { relatedId?: string; relatedType?: string }) => {
    if (!notification.relatedId) return null;
    if (notification.relatedType === "ala") {
      return `/student/alas/${notification.relatedId}`;
    }
    if (notification.relatedType === "submission") {
      return `/student/submissions`;
    }
    return null;
  };

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[{ label: "Student" }, { label: "Notifications" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground">
              Stay updated with your ALAs and submissions
            </p>
          </div>
          <NotificationActions />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: {
                  _id: string;
                  type: string;
                  title: string;
                  message: string;
                  isRead: boolean;
                  createdAt: string;
                  relatedId?: string;
                  relatedType?: string;
                }) => {
                  const link = getLink(notification);
                  const content = (
                    <div
                      className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                        !notification.isRead ? "bg-muted/30 border-primary/20" : ""
                      } ${link ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                    >
                      <div className="mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${!notification.isRead ? "text-primary" : ""}`}>
                            {notification.title}
                          </p>
                          {getTypeBadge(notification.type)}
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  );

                  return link ? (
                    <Link key={notification._id} href={link}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification._id}>{content}</div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
