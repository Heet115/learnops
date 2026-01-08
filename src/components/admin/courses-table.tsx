"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
import {
  BulkActionsBar,
  SelectAllCheckbox,
  SelectRowCheckbox,
  useRowSelection,
} from "@/components/ui/bulk-actions";
import {
  useSimpleSort,
  useTablePagination,
  SimpleSortableHeader,
  PaginationControls,
} from "@/components/ui/enhanced-data-table";
import {
  deleteCourse,
  bulkDeleteCourses,
  bulkToggleCourseStatus,
} from "@/lib/actions/academic.actions";
import {
  MoreHorizontal,
  Trash2,
  Power,
  PowerOff,
  BookOpen,
  Building2,
  Clock,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { ICourse, IDepartment } from "@/lib/db";
import { toast } from "sonner";

interface CoursesTableProps {
  courses: (ICourse & { departmentId?: IDepartment })[];
  departments: IDepartment[];
}

interface CourseWithId {
  _id: string;
  name: string;
  code: string;
  duration: number;
  isActive: boolean;
  departmentId?: IDepartment;
  courseType?: string;
  totalSemesters?: number;
}

const courseTypeConfig: Record<
  string,
  { label: string; color: string }
> = {
  diploma: {
    label: "Diploma",
    color: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  },
  ug: {
    label: "UG",
    color: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  pg: {
    label: "PG",
    color: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  },
};

export function CoursesTable({ courses, departments }: CoursesTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    department: "",
    courseType: "",
    status: "",
  });

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name or code...",
      },
      {
        key: "department",
        label: "Department",
        type: "select",
        options: departments.map((d) => ({
          label: `${d.code} - ${d.name}`,
          value: (d._id as unknown as { toString(): string }).toString(),
        })),
      },
      {
        key: "courseType",
        label: "Type",
        type: "select",
        options: [
          { label: "Diploma", value: "diploma" },
          { label: "Undergraduate", value: "ug" },
          { label: "Postgraduate", value: "pg" },
        ],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
    ],
    [departments],
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const department = filters.department as string;
      const courseType = filters.courseType as string;
      const status = filters.status as string;
      const dept = course.departmentId as unknown as IDepartment | undefined;

      if (search) {
        if (
          !course.name.toLowerCase().includes(search) &&
          !course.code.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      if (department && department !== "all") {
        const deptId = dept
          ? (dept._id as unknown as { toString(): string }).toString()
          : "";
        if (deptId !== department) return false;
      }

      if (courseType && courseType !== "all") {
        if (
          (course as unknown as { courseType?: string }).courseType !==
          courseType
        )
          return false;
      }

      if (status && status !== "all") {
        if (status === "active" && !course.isActive) return false;
        if (status === "inactive" && course.isActive) return false;
      }

      return true;
    });
  }, [courses, filters]);

  const coursesWithId = useMemo(() => {
    return filteredCourses.map((course) => ({
      ...course,
      _id: (course._id as unknown as { toString(): string }).toString(),
    })) as CourseWithId[];
  }, [filteredCourses]);

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    coursesWithId,
    "code" as keyof CourseWithId,
  );

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useTablePagination(sortedData);

  const {
    selectedItems,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    toggleAll,
    toggleRow,
    clearSelection,
    isSelected,
  } = useRowSelection(coursesWithId);

  const bulkActions = useMemo(
    () => [
      {
        label: "Activate",
        icon: <Power className="h-4 w-4" />,
        onClick: async (items: CourseWithId[]) => {
          const ids = items.map((c) => c._id);
          const result = await bulkToggleCourseStatus(ids, true);
          if (result.success) {
            toast.success(`${result.count} courses activated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to activate courses");
          }
        },
      },
      {
        label: "Deactivate",
        icon: <PowerOff className="h-4 w-4" />,
        onClick: async (items: CourseWithId[]) => {
          const ids = items.map((c) => c._id);
          const result = await bulkToggleCourseStatus(ids, false);
          if (result.success) {
            toast.success(`${result.count} courses deactivated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to deactivate courses");
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: CourseWithId[]) => {
          const ids = items.map((c) => c._id);
          const result = await bulkDeleteCourses(ids);
          if (result.success) {
            toast.success(`${result.count} courses deleted`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to delete courses");
          }
        },
      },
    ],
    [clearSelection, router],
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);
    setError("");

    const result = await deleteCourse(deleteId);

    if (result.success) {
      toast.success("Course deleted successfully");
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete course");
      setError(result.error || "Failed to delete");
    }

    setIsLoading(false);
  };

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No courses yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first course to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        <BulkActionsBar
          selectedCount={selectedCount}
          totalCount={coursesWithId.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No courses match your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[50px]">
                      <SelectAllCheckbox
                        checked={
                          isAllSelected
                            ? true
                            : isIndeterminate
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <SimpleSortableHeader<CourseWithId>
                      label="Code"
                      sortKey="code"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<CourseWithId>
                      label="Name"
                      sortKey="name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <SimpleSortableHeader<CourseWithId>
                      label="Duration"
                      sortKey="duration"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>Semesters</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((course) => {
                    const id = course._id;
                    const dept = course.departmentId as unknown as
                      | IDepartment
                      | undefined;
                    const courseData = course as unknown as {
                      courseType?: string;
                      totalSemesters?: number;
                    };
                    const typeConfig = courseData.courseType
                      ? courseTypeConfig[courseData.courseType]
                      : null;

                    return (
                      <TableRow
                        key={id}
                        data-state={isSelected(id) ? "selected" : undefined}
                        className="group"
                      >
                        <TableCell>
                          <SelectRowCheckbox
                            checked={isSelected(id)}
                            onCheckedChange={(checked) =>
                              toggleRow(id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-mono font-semibold">
                              {course.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {course.name}
                        </TableCell>
                        <TableCell>
                          {dept ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <Badge variant="outline" className="font-mono">
                                {dept.code}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {typeConfig ? (
                            <Badge
                              variant="outline"
                              className={typeConfig.color}
                            >
                              {typeConfig.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="tabular-nums">
                              {course.duration}{" "}
                              {course.duration === 1 ? "Year" : "Years"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="tabular-nums">
                              {courseData.totalSemesters || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              course.isActive
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                : "border-zinc-500/30 bg-zinc-500/10 text-zinc-600"
                            }
                          >
                            <span
                              className={`inline-block mr-1.5 h-1.5 w-1.5 rounded-full ${
                                course.isActive
                                  ? "bg-emerald-500"
                                  : "bg-zinc-400"
                              }`}
                            />
                            {course.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              pageIndex={currentPage}
              pageSize={pageSize}
              pageCount={totalPages}
              totalItems={coursesWithId.length}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>Delete Course</AlertDialogTitle>
                <AlertDialogDescription>
                  {error ||
                    "Are you sure? This will also delete all auto-generated semesters for this course. Courses with subjects cannot be deleted."}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
