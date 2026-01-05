"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import {
  UserPlus,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  ArrowRight,
} from "lucide-react";
import type { ActivityAction } from "@/lib/db";

interface DashboardActivityItem {
  _id: string;
  action: ActivityAction;
  entityType: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

interface DashboardActivityProps {
  activities: DashboardActivityItem[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  maxItems?: number;
}

const actionIcons: Partial<Record<ActivityAction, React.ElementType>> = {
  user_created: UserPlus,
  ala_created: FileText,
  submission_created: FileText,
  submission_graded: CheckCircle,
  submission_rejected: XCircle,
  ala_updated: Edit,
};

const actionLabels: Partial<Record<ActivityAction, string>> = {
  user_created: "New user created",
  user_updated: "User updated",
  user_deactivated: "User deactivated",
  ala_created: "New ALA created",
  ala_updated: "ALA updated",
  submission_created: "New submission",
  submission_graded: "Submission graded",
  submission_rejected: "Submission rejected",
};

export function DashboardActivity({
  activities,
  title = "Recent Activity",
  description = "Latest actions in the system",
  viewAllHref,
  maxItems = 5,
}: DashboardActivityProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {viewAllHref && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={viewAllHref}>
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <IllustratedEmpty
            illustration="noData"
            title="No activity yet"
            description="Actions will appear here"
            size="sm"
          />
        ) : (
          <div className="space-y-3">
            {displayActivities.map((activity) => {
              const Icon = actionIcons[activity.action] || FileText;
              const label = actionLabels[activity.action] || activity.action;
              const details = activity.details as
                | Record<string, unknown>
                | undefined;
              const detailTitle = details?.title as string | undefined;
              const detailName = details?.name as string | undefined;

              return (
                <div
                  key={activity._id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      {detailTitle && (
                        <p className="text-muted-foreground text-xs">
                          {detailTitle}
                        </p>
                      )}
                      {detailName && (
                        <p className="text-muted-foreground text-xs">
                          {detailName}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
