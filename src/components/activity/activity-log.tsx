"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
import {
  useTablePagination,
  PaginationControls,
} from "@/components/ui/enhanced-data-table";
import {
  DataExportButton,
  type ExportColumn,
} from "@/components/ui/data-export";
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
  Eye,
} from "lucide-react";
import type { ActivityAction, EntityType } from "@/lib/db";
import type { ActivityItem } from "./activity-feed";

interface ActivityLogProps {
  activities: ActivityItem[];
  title?: string;
  description?: string;
  showExport?: boolean;
  pageSize?: number;
}

const actionConfig: Record<
  ActivityAction,
  {
    icon: React.ElementType;
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  user_created: { icon: UserPlus, label: "Created", variant: "default" },
  user_updated: { icon: Edit, label: "Updated", variant: "secondary" },
  user_deactivated: {
    icon: UserMinus,
    label: "Deactivated",
    variant: "outline",
  },
  user_reactivated: {
    icon: UserCheck,
    label: "Reactivated",
    variant: "default",
  },
  user_deleted: { icon: UserX, label: "Deleted", variant: "destructive" },
  department_created: { icon: Building2, label: "Created", variant: "default" },
  department_updated: { icon: Edit, label: "Updated", variant: "secondary" },
  course_created: { icon: BookOpen, label: "Created", variant: "default" },
  course_updated: { icon: Edit, label: "Updated", variant: "secondary" },
  semester_created: { icon: Calendar, label: "Created", variant: "default" },
  semester_updated: { icon: Edit, label: "Updated", variant: "secondary" },
  subject_created: { icon: Layers, label: "Created", variant: "default" },
  subject_updated: { icon: Edit, label: "Updated", variant: "secondary" },
  class_created: { icon: Users, label: "Created", variant: "default" },
  class_updated: { icon: Edit, label: "Updated", variant: "secondary" },
  subject_offering_created: {
    icon: Plus,
    label: "Created",
    variant: "default",
  },
  subject_offering_updated: {
    icon: Edit,
    label: "Updated",
    variant: "secondary",
  },
  ala_created: { icon: FileText, label: "Created", variant: "default" },
  ala_updated: { icon: Edit, label: "Updated", variant: "secondary" },
  ala_deleted: { icon: Trash2, label: "Deleted", variant: "destructive" },
  submission_created: {
    icon: FileText,
    label: "Submitted",
    variant: "default",
  },
  submission_updated: { icon: Edit, label: "Updated", variant: "secondary" },
  submission_graded: { icon: CheckCircle, label: "Graded", variant: "default" },
  submission_rejected: {
    icon: XCircle,
    label: "Rejected",
    variant: "destructive",
  },
  group_created: { icon: Users, label: "Created", variant: "default" },
  group_updated: { icon: Edit, label: "Updated", variant: "secondary" },
  student_assigned: {
    icon: GraduationCap,
    label: "Assigned",
    variant: "default",
  },
  professor_assigned: {
    icon: UserCheck,
    label: "Assigned",
    variant: "default",
  },
};

const entityLabels: Record<EntityType, string> = {
  user: "User",
  department: "Department",
  course: "Course",
  semester: "Semester",
  subject: "Subject",
  class: "Class",
  subject_offering: "Offering",
  ala: "ALA",
  submission: "Submission",
  group: "Group",
};

const filterConfigs: FilterConfig[] = [
  {
    key: "search",
    label: "Search",
    type: "text",
    placeholder: "Search by user name...",
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

const exportColumns: ExportColumn<ActivityItem>[] = [
  {
    key: "createdAt",
    header: "Date",
    accessor: (row) => row.createdAt,
    format: (v) => format(new Date(v as string), "PPpp"),
  },
  {
    key: "userId",
    header: "User",
    accessor: (row) => `${row.userId.firstName} ${row.userId.lastName}`,
  },
  {
    key: "action",
    header: "Action",
    accessor: (row) => row.action,
  },
  {
    key: "entityType",
    header: "Entity Type",
    accessor: (row) => row.entityType,
  },
  {
    key: "entityId",
    header: "Entity ID",
    accessor: (row) => row.entityId,
  },
  {
    key: "details",
    header: "Details",
    accessor: (row) => JSON.stringify(row.details || {}),
  },
];

export function ActivityLog({
  activities,
  title = "Activity Log",
  description,
  showExport = true,
  pageSize = 10,
}: ActivityLogProps) {
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    entityType: "",
  });

  const filteredActivities = activities.filter((activity) => {
    if (filters.search) {
      const search = (filters.search as string).toLowerCase();
      const userName =
        `${activity.userId.firstName} ${activity.userId.lastName}`.toLowerCase();
      if (!userName.includes(search)) return false;
    }
    if (filters.entityType && activity.entityType !== filters.entityType) {
      return false;
    }
    return true;
  });

  const {
    paginatedData,
    currentPage,
    pageSize: currentPageSize,
    totalPages,
    canPreviousPage,
    canNextPage,
    setCurrentPage,
    setPageSize,
  } = useTablePagination(filteredActivities, pageSize);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {showExport && activities.length > 0 && (
            <DataExportButton
              data={filteredActivities}
              columns={exportColumns}
              filename="activity-log"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <DataTableFilter
            filters={filterConfigs}
            values={filters}
            onChange={setFilters}
          />
        </div>

        {filteredActivities.length === 0 ? (
          <IllustratedEmpty
            illustration="noData"
            title="No activities"
            description="No activities match your filters"
          />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((activity) => {
                    const config = actionConfig[activity.action];
                    const Icon = config?.icon || FileText;

                    return (
                      <TableRow key={activity._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              name={`${activity.userId.firstName} ${activity.userId.lastName}`}
                              image={activity.userId.profileImage}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {activity.userId.firstName}{" "}
                                {activity.userId.lastName}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {activity.userId.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="text-muted-foreground h-4 w-4" />
                            <Badge variant={config?.variant || "secondary"}>
                              {config?.label || activity.action}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entityLabels[activity.entityType] ||
                              activity.entityType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(
                            new Date(activity.createdAt),
                            "MMM d, h:mm a",
                          )}
                        </TableCell>
                        <TableCell>
                          {activity.details &&
                            Object.keys(activity.details).length > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <PaginationControls
                pageIndex={currentPage}
                pageSize={currentPageSize}
                pageCount={totalPages}
                totalItems={filteredActivities.length}
                canPreviousPage={canPreviousPage}
                canNextPage={canNextPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
