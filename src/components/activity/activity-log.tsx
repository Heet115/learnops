"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DataTableFilter,
  FilterConfig,
} from "@/components/ui/data-table-filter";
import { SaveFiltersButton } from "@/components/ui/save-filters-button";
import { usePersistedFilters } from "@/hooks/use-persisted-filters";
import {
  useTablePagination,
  PaginationControls,
} from "@/components/ui/enhanced-data-table";
import {
  DataExportButton,
  type ExportColumn,
} from "@/components/ui/data-export";
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
  ScrollText,
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
    className: string;
  }
> = {
  user_created: {
    icon: UserPlus,
    label: "Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  user_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  user_deactivated: {
    icon: UserMinus,
    label: "Deactivated",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  },
  user_reactivated: {
    icon: UserCheck,
    label: "Reactivated",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  user_deleted: {
    icon: UserX,
    label: "Deleted",
    className: "border-red-500/30 bg-red-500/10 text-red-600",
  },
  department_created: {
    icon: Building2,
    label: "Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  department_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  course_created: {
    icon: BookOpen,
    label: "Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  course_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  semester_created: {
    icon: Calendar,
    label: "Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  semester_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  subject_created: {
    icon: Layers,
    label: "Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  subject_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  class_created: {
    icon: Users,
    label: "Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  class_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  subject_offering_created: {
    icon: Plus,
    label: "Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  subject_offering_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  ala_created: {
    icon: FileText,
    label: "Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  ala_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  ala_deleted: {
    icon: Trash2,
    label: "Deleted",
    className: "border-red-500/30 bg-red-500/10 text-red-600",
  },
  submission_created: {
    icon: FileText,
    label: "Submitted",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  submission_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  submission_graded: {
    icon: CheckCircle,
    label: "Graded",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  submission_rejected: {
    icon: XCircle,
    label: "Rejected",
    className: "border-red-500/30 bg-red-500/10 text-red-600",
  },
  group_created: {
    icon: Users,
    label: "Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  group_updated: {
    icon: Edit,
    label: "Updated",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  student_assigned: {
    icon: GraduationCap,
    label: "Assigned",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  },
  professor_assigned: {
    icon: UserCheck,
    label: "Assigned",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-600",
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
  const {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  } = usePersistedFilters({
    storageKey: "activity-log-filters",
    defaultFilters: { search: "", entityType: "" },
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

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <ScrollText className="text-primary h-4 w-4" />
              </div>
              <CardTitle>{title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
              <ScrollText className="text-muted-foreground h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No activities yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Activity logs will appear here as actions are performed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <ScrollText className="text-primary h-4 w-4" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              {description && (
                <p className="text-muted-foreground text-sm">{description}</p>
              )}
            </div>
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
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex-1">
              <DataTableFilter
                filters={filterConfigs}
                values={filters}
                onChange={setFilters}
              />
            </div>
            <SaveFiltersButton
              hasActiveFilters={hasActiveFilters}
              hasSavedFilters={hasSavedFilters}
              onSave={saveFilters}
              onReset={resetFilters}
            />
          </div>

          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                <ScrollText className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="text-muted-foreground mt-3 text-sm">
                No activities match your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="min-w-[200px]">User</TableHead>
                      <TableHead className="min-w-[120px]">Action</TableHead>
                      <TableHead className="min-w-[100px]">Entity</TableHead>
                      <TableHead className="min-w-[140px]">Date</TableHead>
                      <TableHead className="w-[50px] min-w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((activity) => {
                      const config = actionConfig[activity.action];
                      const Icon = config?.icon || FileText;

                      return (
                        <TableRow key={activity._id} className="group">
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
                              <div className="bg-muted flex h-6 w-6 items-center justify-center rounded">
                                <Icon className="text-muted-foreground h-3.5 w-3.5" />
                              </div>
                              <Badge
                                variant="outline"
                                className={config?.className || ""}
                              >
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
                          <TableCell>
                            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(
                                new Date(activity.createdAt),
                                "MMM d, h:mm a",
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {activity.details &&
                              Object.keys(activity.details).length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
