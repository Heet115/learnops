"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import {
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Trash2,
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ActivityAction, EntityType } from "@/lib/db";

interface ActivityUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImage?: string;
}

export interface ActivityItem {
  _id: string;
  userId: ActivityUser;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  description?: string;
  showFilters?: boolean;
  showUser?: boolean;
  maxHeight?: string;
  emptyMessage?: string;
}

const actionConfig: Record<
  ActivityAction,
  { icon: React.ElementType; label: string; color: string }
> = {
  user_created: {
    icon: UserPlus,
    label: "Created user",
    color: "text-green-600",
  },
  user_updated: { icon: Edit, label: "Updated user", color: "text-blue-600" },
  user_deactivated: {
    icon: UserMinus,
    label: "Deactivated user",
    color: "text-orange-600",
  },
  user_reactivated: {
    icon: UserCheck,
    label: "Reactivated user",
    color: "text-green-600",
  },
  user_deleted: { icon: UserX, label: "Deleted user", color: "text-red-600" },
  department_created: {
    icon: Building2,
    label: "Created department",
    color: "text-green-600",
  },
  department_updated: {
    icon: Edit,
    label: "Updated department",
    color: "text-blue-600",
  },
  course_created: {
    icon: BookOpen,
    label: "Created course",
    color: "text-green-600",
  },
  course_updated: {
    icon: Edit,
    label: "Updated course",
    color: "text-blue-600",
  },
  semester_created: {
    icon: Calendar,
    label: "Created semester",
    color: "text-green-600",
  },
  semester_updated: {
    icon: Edit,
    label: "Updated semester",
    color: "text-blue-600",
  },
  subject_created: {
    icon: Layers,
    label: "Created subject",
    color: "text-green-600",
  },
  subject_updated: {
    icon: Edit,
    label: "Updated subject",
    color: "text-blue-600",
  },
  class_created: {
    icon: Users,
    label: "Created class",
    color: "text-green-600",
  },
  class_updated: { icon: Edit, label: "Updated class", color: "text-blue-600" },
  subject_offering_created: {
    icon: Plus,
    label: "Created offering",
    color: "text-green-600",
  },
  subject_offering_updated: {
    icon: Edit,
    label: "Updated offering",
    color: "text-blue-600",
  },
  ala_created: {
    icon: FileText,
    label: "Created ALA",
    color: "text-green-600",
  },
  ala_updated: { icon: Edit, label: "Updated ALA", color: "text-blue-600" },
  ala_deleted: { icon: Trash2, label: "Deleted ALA", color: "text-red-600" },
  submission_created: {
    icon: FileText,
    label: "Submitted",
    color: "text-blue-600",
  },
  submission_updated: {
    icon: Edit,
    label: "Updated submission",
    color: "text-blue-600",
  },
  submission_graded: {
    icon: CheckCircle,
    label: "Graded",
    color: "text-green-600",
  },
  submission_rejected: {
    icon: XCircle,
    label: "Rejected",
    color: "text-red-600",
  },
  group_created: {
    icon: Users,
    label: "Created group",
    color: "text-green-600",
  },
  group_updated: { icon: Edit, label: "Updated group", color: "text-blue-600" },
  student_assigned: {
    icon: GraduationCap,
    label: "Assigned student",
    color: "text-purple-600",
  },
  professor_assigned: {
    icon: UserCheck,
    label: "Assigned professor",
    color: "text-purple-600",
  },
};

const entityLabels: Record<EntityType, string> = {
  user: "User",
  department: "Department",
  course: "Course",
  semester: "Semester",
  subject: "Subject",
  class: "Class",
  subject_offering: "Subject Offering",
  ala: "ALA",
  submission: "Submission",
  group: "Group",
};

const filterConfigs: FilterConfig[] = [
  {
    key: "action",
    label: "Action",
    type: "select",
    options: Object.entries(actionConfig).map(([value, { label }]) => ({
      label,
      value,
    })),
  },
  {
    key: "entityType",
    label: "Entity",
    type: "select",
    options: Object.entries(entityLabels).map(([value, label]) => ({
      label,
      value,
    })),
  },
];

export function ActivityFeed({
  activities,
  title = "Activity Feed",
  description,
  showFilters = false,
  showUser = true,
  maxHeight = "400px",
  emptyMessage = "No activities yet",
}: ActivityFeedProps) {
  const [filters, setFilters] = useState<FilterValue>({
    action: "",
    entityType: "",
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (filters.action && activity.action !== filters.action) return false;
      if (filters.entityType && activity.entityType !== filters.entityType)
        return false;
      return true;
    });
  }, [activities, filters]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderDetails = (details: Record<string, unknown>) => {
    const entries = Object.entries(details).filter(
      ([, value]) => value !== undefined && value !== null,
    );
    if (entries.length === 0) return null;

    return (
      <div className="bg-muted/50 mt-2 rounded-md p-2 text-xs">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium capitalize">
              {key.replace(/_/g, " ")}:
            </span>
            <span className="text-muted-foreground">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-4">
            <DataTableFilter
              filters={filterConfigs}
              values={filters}
              onChange={setFilters}
            />
          </div>
        )}

        {filteredActivities.length === 0 ? (
          <IllustratedEmpty
            illustration="noData"
            title="No activities"
            description={emptyMessage}
          />
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            <div className="space-y-3">
              {filteredActivities.map((activity) => {
                const config = actionConfig[activity.action];
                const Icon = config?.icon || FileText;
                const isExpanded = expanded.has(activity._id);
                const hasDetails =
                  activity.details && Object.keys(activity.details).length > 0;

                return (
                  <div
                    key={activity._id}
                    className="hover:bg-muted/50 flex gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <div
                      className={`bg-muted mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config?.color || "text-muted-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {showUser && activity.userId && (
                            <div className="mb-1 flex items-center gap-2">
                              <UserAvatar
                                name={`${activity.userId.firstName} ${activity.userId.lastName}`}
                                image={activity.userId.profileImage}
                                size="xs"
                              />
                              <span className="text-sm font-medium">
                                {activity.userId.firstName}{" "}
                                {activity.userId.lastName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {activity.userId.role}
                              </Badge>
                            </div>
                          )}

                          <p className="text-sm">
                            <span className={config?.color || ""}>
                              {config?.label || activity.action}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              •{" "}
                              {entityLabels[activity.entityType] ||
                                activity.entityType}
                            </span>
                          </p>

                          {hasDetails &&
                            isExpanded &&
                            renderDetails(activity.details!)}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className="text-muted-foreground text-xs"
                            title={format(new Date(activity.createdAt), "PPpp")}
                          >
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                            })}
                          </span>

                          {hasDetails && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleExpand(activity._id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
