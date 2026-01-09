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
} from "@/components/ui/data-table-filter";
import { SaveFiltersButton } from "@/components/ui/save-filters-button";
import { usePersistedFilters } from "@/hooks/use-persisted-filters";
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
  deleteSemester,
  bulkDeleteSemesters,
  bulkToggleSemesterStatus,
} from "@/lib/actions/academic.actions";
import {
  MoreHorizontal,
  Trash2,
  Power,
  PowerOff,
  Calendar,
  BookOpen,
  Building2,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { ISemester, ICourse, IDepartment } from "@/lib/db";
import { toast } from "sonner";

interface SemestersTableProps {
  semesters: (ISemester & {
    courseId?: ICourse & { departmentId?: IDepartment };
  })[];
}

interface SemesterWithId {
  _id: string;
  name: string;
  number: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  courseId?: ICourse & { departmentId?: IDepartment };
  // Computed fields for sorting
  courseCode: string;
  departmentCode: string;
  statusLabel: string;
}

export function SemestersTable({ semesters }: SemestersTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  } = usePersistedFilters({
    storageKey: "admin-semesters-filters",
    defaultFilters: { search: "", course: "", status: "" },
  });

  const courseOptions = useMemo(() => {
    const uniqueCourses = new Map<string, { label: string; value: string }>();
    semesters.forEach((sem) => {
      const course = sem.courseId as unknown as
        | (ICourse & { departmentId?: IDepartment })
        | undefined;
      if (course) {
        const id = (course._id as unknown as { toString(): string }).toString();
        if (!uniqueCourses.has(id)) {
          uniqueCourses.set(id, {
            label: `${course.code} - ${course.name}`,
            value: id,
          });
        }
      }
    });
    return Array.from(uniqueCourses.values());
  }, [semesters]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name...",
      },
      {
        key: "course",
        label: "Course",
        type: "select",
        options: courseOptions,
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
    [courseOptions],
  );

  const filteredSemesters = useMemo(() => {
    return semesters.filter((semester) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const courseFilter = filters.course as string;
      const status = filters.status as string;
      const course = semester.courseId as unknown as
        | (ICourse & { departmentId?: IDepartment })
        | undefined;

      if (search && !semester.name.toLowerCase().includes(search)) return false;

      if (courseFilter && courseFilter !== "all") {
        const courseId = course
          ? (course._id as unknown as { toString(): string }).toString()
          : "";
        if (courseId !== courseFilter) return false;
      }

      if (status && status !== "all") {
        if (status === "active" && !semester.isActive) return false;
        if (status === "inactive" && semester.isActive) return false;
      }

      return true;
    });
  }, [semesters, filters]);

  const semestersWithId = useMemo(() => {
    return filteredSemesters.map((semester) => {
      const course = semester.courseId as unknown as
        | (ICourse & { departmentId?: IDepartment })
        | undefined;
      const dept = course?.departmentId as unknown as IDepartment | undefined;
      return {
        ...semester,
        _id: (semester._id as unknown as { toString(): string }).toString(),
        courseCode: course?.code || "",
        departmentCode: dept?.code || "",
        statusLabel: semester.isActive ? "Active" : "Inactive",
      };
    }) as SemesterWithId[];
  }, [filteredSemesters]);

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    semestersWithId,
    "name" as keyof SemesterWithId,
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
  } = useRowSelection(semestersWithId);

  const bulkActions = useMemo(
    () => [
      {
        label: "Activate",
        icon: <Power className="h-4 w-4" />,
        onClick: async (items: SemesterWithId[]) => {
          const ids = items.map((s) => s._id);
          const result = await bulkToggleSemesterStatus(ids, true);
          if (result.success) {
            toast.success(`${result.count} semesters activated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to activate semesters");
          }
        },
      },
      {
        label: "Deactivate",
        icon: <PowerOff className="h-4 w-4" />,
        onClick: async (items: SemesterWithId[]) => {
          const ids = items.map((s) => s._id);
          const result = await bulkToggleSemesterStatus(ids, false);
          if (result.success) {
            toast.success(`${result.count} semesters deactivated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to deactivate semesters");
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: SemesterWithId[]) => {
          const ids = items.map((s) => s._id);
          const result = await bulkDeleteSemesters(ids);
          if (result.success) {
            toast.success(`${result.count} semesters deleted`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to delete semesters");
          }
        },
      },
    ],
    [clearSelection, router],
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);

    const result = await deleteSemester(deleteId);

    if (result.success) {
      toast.success("Semester deleted successfully");
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete semester");
    }

    setIsLoading(false);
  };

  if (semesters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <Calendar className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No semesters yet</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Semesters are auto-created when you create a course.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
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

        <BulkActionsBar
          selectedCount={selectedCount}
          totalCount={semestersWithId.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredSemesters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <Calendar className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              No semesters match your filters.
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
                    <SimpleSortableHeader<SemesterWithId>
                      label="Semester"
                      sortKey="name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<SemesterWithId>
                      label="Course"
                      sortKey="courseCode"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<SemesterWithId>
                      label="Department"
                      sortKey="departmentCode"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<SemesterWithId>
                      label="Duration"
                      sortKey="startDate"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<SemesterWithId>
                      label="Status"
                      sortKey="statusLabel"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((semester) => {
                    const id = semester._id;
                    const course = semester.courseId as unknown as
                      | (ICourse & { departmentId?: IDepartment })
                      | undefined;
                    const dept = course?.departmentId as unknown as
                      | IDepartment
                      | undefined;
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
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-medium">
                                {semester.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="ml-2 font-mono text-xs"
                              >
                                #{semester.number}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {course ? (
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="text-muted-foreground h-3.5 w-3.5" />
                              <Badge variant="outline" className="font-mono">
                                {course.code}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {dept ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                              <span className="text-sm">{dept.code}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {semester.startDate && semester.endDate ? (
                            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span className="tabular-nums">
                                {new Date(
                                  semester.startDate,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                -{" "}
                                {new Date(semester.endDate).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                            >
                              Not set
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              semester.isActive
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                : "border-zinc-500/30 bg-zinc-500/10 text-zinc-600"
                            }
                          >
                            <span
                              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                                semester.isActive
                                  ? "bg-emerald-500"
                                  : "bg-zinc-400"
                              }`}
                            />
                            {semester.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 transition-opacity group-hover:opacity-100"
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
              totalItems={filteredSemesters.length}
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
              <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-full">
                <AlertTriangle className="text-destructive h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle>Delete Semester</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure? This action cannot be undone. Semesters with
                  subjects or classes cannot be deleted.
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
