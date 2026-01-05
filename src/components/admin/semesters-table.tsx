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
  FilterValue,
} from "@/components/ui/data-table-filter";
import {
  BulkActionsBar,
  SelectAllCheckbox,
  SelectRowCheckbox,
  useRowSelection,
} from "@/components/ui/bulk-actions";
import { useSimpleSort, useTablePagination, SimpleSortableHeader, PaginationControls } from "@/components/ui/enhanced-data-table";
import {
  deleteSemester,
  bulkDeleteSemesters,
  bulkToggleSemesterStatus,
} from "@/lib/actions/academic.actions";
import { MoreHorizontal, Trash2, Power, PowerOff } from "lucide-react";
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
}

export function SemestersTable({ semesters }: SemestersTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    course: "",
    status: "",
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
    return filteredSemesters.map((semester) => ({
      ...semester,
      _id: (semester._id as unknown as { toString(): string }).toString(),
    })) as SemesterWithId[];
  }, [filteredSemesters]);

  // Sorting
  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(semestersWithId, "name" as keyof SemesterWithId);

  const { paginatedData, currentPage, pageSize, totalPages, setCurrentPage, setPageSize } = useTablePagination(sortedData);

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
    [clearSelection, router]
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
      <div className="text-muted-foreground py-8 text-center">
        No semesters found. Create your first semester to get started.
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
          totalCount={semestersWithId.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredSemesters.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No semesters match your filters.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <SelectAllCheckbox
                      checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
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
                  <TableHead>Course</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
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
                    >
                      <TableCell>
                        <SelectRowCheckbox
                          checked={isSelected(id)}
                          onCheckedChange={(checked) => toggleRow(id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{semester.name}</span>
                          <span className="text-muted-foreground ml-2">
                            (#{semester.number})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {course ? (
                          <Badge variant="outline">{course.code}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{dept ? dept.code : "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {semester.startDate && semester.endDate ? (
                          <>
                            {new Date(semester.startDate).toLocaleDateString()} -{" "}
                            {new Date(semester.endDate).toLocaleDateString()}
                          </>
                        ) : (
                          "Not set"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={semester.isActive ? "default" : "secondary"}
                        >
                          {semester.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
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
            <AlertDialogTitle>Delete Semester</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
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
