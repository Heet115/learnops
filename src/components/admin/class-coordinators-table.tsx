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
import { Badge } from "@/components/ui/badge";
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Crown,
  User,
  GraduationCap,
  Calendar,
  BookOpen,
  Building2,
  AlertTriangle,
} from "lucide-react";
import {
  deleteClassCoordinator,
  bulkDeleteClassCoordinators,
} from "@/lib/actions/academic.actions";
import { toast } from "sonner";
import { EditCoordinatorDialog } from "./edit-coordinator-dialog";

interface ClassCoordinator {
  _id: string;
  academicYear: string;
  classId: {
    _id: string;
    name: string;
    academicYear: string;
    semesterId: {
      _id: string;
      name: string;
      number: number;
      courseId: {
        name: string;
        code: string;
        departmentId: {
          name: string;
          code: string;
        };
      };
    };
  };
  professorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassCoordinatorsTableProps {
  coordinators: ClassCoordinator[];
  professors: Professor[];
}

export function ClassCoordinatorsTable({
  coordinators,
  professors,
}: ClassCoordinatorsTableProps) {
  const [editingCoordinator, setEditingCoordinator] =
    useState<ClassCoordinator | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteClassName, setDeleteClassName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    department: "",
    academicYear: "",
  });

  const { departmentOptions, yearOptions } = useMemo(() => {
    const deptMap = new Map<string, { label: string; value: string }>();
    const yearSet = new Set<string>();
    coordinators.forEach((c) => {
      const dept = c.classId?.semesterId?.courseId?.departmentId;
      if (dept) {
        deptMap.set(dept.code, {
          label: `${dept.code} - ${dept.name}`,
          value: dept.code,
        });
      }
      if (c.academicYear) yearSet.add(c.academicYear);
    });
    const yearOpts = Array.from(yearSet)
      .sort()
      .reverse()
      .map((y) => ({ label: y, value: y }));
    return {
      departmentOptions: Array.from(deptMap.values()),
      yearOptions: yearOpts,
    };
  }, [coordinators]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by class or professor...",
      },
      {
        key: "department",
        label: "Department",
        type: "select",
        options: departmentOptions,
      },
      {
        key: "academicYear",
        label: "Academic Year",
        type: "select",
        options: yearOptions,
      },
    ],
    [departmentOptions, yearOptions],
  );

  const filteredCoordinators = useMemo(() => {
    return coordinators.filter((coordinator) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const department = filters.department as string;
      const academicYear = filters.academicYear as string;

      if (search) {
        const className = coordinator.classId?.name?.toLowerCase() || "";
        const profName =
          `${coordinator.professorId?.firstName} ${coordinator.professorId?.lastName}`.toLowerCase();
        if (!className.includes(search) && !profName.includes(search))
          return false;
      }

      if (
        department &&
        department !== "all" &&
        coordinator.classId?.semesterId?.courseId?.departmentId?.code !==
          department
      )
        return false;
      if (
        academicYear &&
        academicYear !== "all" &&
        coordinator.academicYear !== academicYear
      )
        return false;

      return true;
    });
  }, [coordinators, filters]);

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    filteredCoordinators,
    "academicYear" as keyof ClassCoordinator,
    "desc",
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
  } = useRowSelection(filteredCoordinators);

  const bulkActions = useMemo(
    () => [
      {
        label: "Remove",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: ClassCoordinator[]) => {
          const ids = items.map((c) => c._id);
          const result = await bulkDeleteClassCoordinators(ids);
          if (result.success) {
            toast.success(`${result.count} coordinators removed`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to remove coordinators");
          }
        },
      },
    ],
    [clearSelection, router],
  );

  const handleDeleteClick = (id: string, className: string) => {
    setDeleteId(id);
    setDeleteClassName(className);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);

    const result = await deleteClassCoordinator(deleteId);

    if (result.success) {
      toast.success("Coordinator removed successfully");
      setDeleteId(null);
      setDeleteClassName("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove coordinator");
    }

    setIsLoading(false);
  };

  if (coordinators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <Crown className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No coordinators assigned</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Assign your first class coordinator to get started.
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
          totalCount={filteredCoordinators.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredCoordinators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <Crown className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              No coordinators match your filters.
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
                    <TableHead>Class</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <SimpleSortableHeader<ClassCoordinator>
                      label="Academic Year"
                      sortKey="academicYear"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((coordinator) => (
                    <TableRow
                      key={coordinator._id}
                      data-state={
                        isSelected(coordinator._id) ? "selected" : undefined
                      }
                      className="group"
                    >
                      <TableCell>
                        <SelectRowCheckbox
                          checked={isSelected(coordinator._id)}
                          onCheckedChange={(checked) =>
                            toggleRow(coordinator._id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                            <Crown className="h-4 w-4 text-amber-600" />
                          </div>
                          <span className="font-medium">
                            {coordinator.classId?.name || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                          {coordinator.classId?.semesterId?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="text-muted-foreground h-3.5 w-3.5" />
                          <Badge variant="outline" className="font-mono">
                            {coordinator.classId?.semesterId?.courseId?.code ||
                              "N/A"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                          <span>
                            {coordinator.classId?.semesterId?.courseId
                              ?.departmentId?.code || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10">
                            <User className="h-3.5 w-3.5 text-violet-600" />
                          </div>
                          <div>
                            <span className="font-medium">
                              {coordinator.professorId?.firstName}{" "}
                              {coordinator.professorId?.lastName}
                            </span>
                            <p className="text-muted-foreground text-xs">
                              {coordinator.professorId?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                          {coordinator.academicYear}
                        </div>
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
                              onClick={() => setEditingCoordinator(coordinator)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Change Coordinator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                handleDeleteClick(
                                  coordinator._id,
                                  coordinator.classId?.name || "",
                                )
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              pageIndex={currentPage}
              pageSize={pageSize}
              pageCount={totalPages}
              totalItems={filteredCoordinators.length}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {editingCoordinator && (
        <EditCoordinatorDialog
          coordinator={editingCoordinator}
          professors={professors}
          open={!!editingCoordinator}
          onOpenChange={(open) => !open && setEditingCoordinator(null)}
        />
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={() => {
          setDeleteId(null);
          setDeleteClassName("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-full">
                <AlertTriangle className="text-destructive h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle>Remove Coordinator</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove the coordinator for &quot;
                  {deleteClassName}&quot;?
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
              {isLoading ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
