"use client";

import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import {
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Upload,
  Clock,
} from "lucide-react";
import type { ActivityAction } from "@/lib/db";

interface TimelineItem {
  _id: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  title?: string;
  description?: string;
  emptyMessage?: string;
}

const submissionActionConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  submission_created: {
    icon: Upload,
    label: "Submitted",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  submission_updated: {
    icon: Edit,
    label: "Updated",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  submission_graded: {
    icon: CheckCircle,
    label: "Graded",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  submission_rejected: {
    icon: XCircle,
    label: "Rejected",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

function TimelineItemDetails({
  details,
}: {
  details: Record<string, unknown>;
}) {
  const alaTitle = details.alaTitle as string | undefined;
  const marks = details.marks as number | undefined;
  const maxMarks = details.maxMarks as number | undefined;
  const feedback = details.feedback as string | undefined;
  const rejectionReason = details.rejectionReason as string | undefined;

  return (
    <div className="text-muted-foreground mt-1 space-y-1 text-sm">
      {alaTitle && <p>ALA: {alaTitle}</p>}
      {marks !== undefined && (
        <p>
          Marks:{" "}
          <Badge variant="secondary">
            {marks}
            {maxMarks && `/${maxMarks}`}
          </Badge>
        </p>
      )}
      {feedback && <p className="italic">&quot;{feedback}&quot;</p>}
      {rejectionReason && (
        <p className="text-red-600">Reason: {rejectionReason}</p>
      )}
    </div>
  );
}

export function ActivityTimeline({
  items,
  title = "Submission Timeline",
  description,
  emptyMessage = "No submission activity yet",
}: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <IllustratedEmpty
            illustration="noData"
            title="No activity"
            description={emptyMessage}
          />
        </CardContent>
      </Card>
    );
  }

  // Group items by date
  const groupedItems = items.reduce(
    (acc, item) => {
      const date = format(new Date(item.createdAt), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    },
    {} as Record<string, TimelineItem[]>,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="bg-border absolute top-0 left-4 h-full w-0.5" />

          <div className="space-y-6">
            {Object.entries(groupedItems).map(([date, dateItems]) => (
              <div key={date}>
                {/* Date header */}
                <div className="relative mb-3 flex items-center gap-3">
                  <div className="bg-background z-10 flex h-8 w-8 items-center justify-center rounded-full border">
                    <Clock className="text-muted-foreground h-4 w-4" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">
                    {format(new Date(date), "EEEE, MMMM d, yyyy")}
                  </span>
                </div>

                {/* Items for this date */}
                <div className="ml-4 space-y-3 border-l-2 border-transparent pl-7">
                  {dateItems.map((item) => {
                    const config = submissionActionConfig[item.action] || {
                      icon: FileText,
                      label: item.action,
                      color: "text-muted-foreground",
                      bgColor: "bg-muted",
                    };
                    const Icon = config.icon;

                    return (
                      <div
                        key={item._id}
                        className="relative flex items-start gap-3"
                      >
                        {/* Connector dot */}
                        <div
                          className={`absolute top-2 -left-[33px] h-2.5 w-2.5 rounded-full ${config.bgColor} ring-background ring-2`}
                        />

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
                        >
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {format(new Date(item.createdAt), "h:mm a")}
                            </span>
                          </div>

                          {item.details && (
                            <TimelineItemDetails details={item.details} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
