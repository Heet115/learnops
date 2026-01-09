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
import { Bell, FileText, Clock, Award, XCircle, Inbox } from "lucide-react";
import { NotificationActions } from "@/components/student/notification-actions";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

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
        return { icon: FileText, color: "blue" };
      case "deadline_reminder":
        return { icon: Clock, color: "amber" };
      case "submission_graded":
        return { icon: Award, color: "emerald" };
      case "submission_rejected":
        return { icon: XCircle, color: "rose" };
      default:
        return { icon: Bell, color: "blue" };
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "new_ala":
        return {
          label: "New ALA",
          className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
          dotColor: "bg-blue-500",
        };
      case "deadline_reminder":
        return {
          label: "Deadline",
          className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
          dotColor: "bg-amber-500",
        };
      case "submission_graded":
        return {
          label: "Graded",
          className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
          dotColor: "bg-emerald-500",
        };
      case "submission_rejected":
        return {
          label: "Rejected",
          className: "border-rose-500/30 bg-rose-500/10 text-rose-600",
          dotColor: "bg-rose-500",
        };
      default:
        return {
          label: "System",
          className: "border-slate-500/30 bg-slate-500/10 text-slate-600",
          dotColor: "bg-slate-500",
        };
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

  const getLink = (notification: {
    relatedId?: string;
    relatedType?: string;
  }) => {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Bell className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Notifications</h2>
              <p className="text-muted-foreground">
                Stay updated with your ALAs and submissions
              </p>
            </div>
          </div>
          <NotificationActions />
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <Inbox className="text-primary h-4 w-4" />
              </div>
              <div>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>
                  {notifications.length} notification
                  {notifications.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                  <Bell className="text-muted-foreground h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-medium">No notifications yet</p>
                <p className="text-muted-foreground text-sm">
                  You&apos;ll see updates about your ALAs here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(
                  (notification: {
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
                    const iconConfig = getIcon(notification.type);
                    const IconComponent = iconConfig.icon;
                    const typeBadge = getTypeBadge(notification.type);

                    const content = (
                      <div
                        className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                          !notification.isRead
                            ? "border-primary/20 bg-primary/5"
                            : "bg-card"
                        } ${link ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorMap[iconConfig.color]}`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <p
                              className={`font-medium ${!notification.isRead ? "text-primary" : ""}`}
                            >
                              {notification.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={typeBadge.className}
                            >
                              <span
                                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${typeBadge.dotColor}`}
                              />
                              {typeBadge.label}
                            </Badge>
                            {!notification.isRead && (
                              <span className="bg-primary h-2 w-2 rounded-full" />
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {notification.message}
                          </p>
                          <p className="text-muted-foreground mt-2 text-xs">
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
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
