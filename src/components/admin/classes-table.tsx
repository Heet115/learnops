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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  Power,
  PowerOff,
  Users2,
  Calendar,
  BookOpen,
  Building2,
  CalendarRange,
} from "lucide-react";
import {
  deleteClass,
  bulkDeleteClasses,
  bulkToggleClassStatus,
} from "@/lib/actions/academic.actions";
import { toast } from "sonner";
import { EditClassDialog } from "./edit-class-dialog";

interface ClassItem {
  _id: string;
  name: string;
  academicYear: string;
  isActive: boolean;
  semesterId: {
    _id: string;
    name: string;
    number: number;
    courseId: {
      _id: string;
      name: string;
      code: string;
      departmentId: {
        name: string;
        code: string;
      };
    };
  };
}

interface Semester {
  _id: string;
  name: string;
  number: number;
  courseId: {
    _id: string;
    name: string;
    code: string;
    departmentId: {
      name: string;
      code: string;
    };
  };
}

interface ClassesTableProps {
  classes: ClassItem[];
  semesters: Semester[];
}

export function ClassesTable({ classes, semesters }: ClassesTableProps) {
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({
    open: false,
    id: "",
    name: "",
  });
  const router = useRouter();
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    semester: "",
    department: "",
    academicYear: "",
    status: "",
  });

  const { semesterOptions, departmentOptions, yearOptions } = useMemo(() => {
    const semOpts = semesters.map((s) => ({
      label: `${s.name} - ${s.courseId?.code || ""}`,
      value: s._id,
    }));
    const deptMap = new Map<string, { label: string; value: string }>();
    const yearSet = new Set<string>();
    classes.forEach((cls) => {
      const dept = cls.semesterId?.courseId?.departmentId;
      if (dept) {
        deptMap.set(dept.code, {
          label: `${dept.code} - ${dept.name}`,
          value: dept.code,
        });
      }
      if (cls.academicYear) yearSet.add(cls.academicYear);
    });
    const yearOpts = Array.from(yearSet)
      .sort()
      .reverse()
      .map((y) => ({ label: y, value: y }));
    return {
      semesterOptions: semOpts,
      departmentOptions: Array.from(deptMap.values()),
      yearOptions: yearOpts,
    };
  }, [semesters, classes]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name...",
      },
      {
        key: "semester",
        label: "Semester",
        type: "select",
        options: semesterOptions,
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
    [semesterOptions, departmentOptions, yearOptions],
  );

  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const semester = filters.semester as string;
      const department = filters.department as string;
      const academicYear = filters.academicYear as string;
      const status = filters.status as string;

      if (search && !classItem.name.toLowerCase().includes(search))
        return false;
      if (
        semester &&
        semester !== "all" &&
        classItem.semesterId?._id !== semester
      )
        return false;
      if (
        department &&
        department !== "all" &&
        classItem.semesterId?.courseId?.departmentId?.code !== department
      )
        return false;
      if (
        academicYear &&
        academicYear !== "all" &&
        classItem.academicYear !== academicYear
      )
        return false;

      if (status && status !== "all") {
        if (status === "active" && !classItem.isActive) return false;
        if (status === "inactive" && classItem.isActive) return false;
      }

      return true;
    });
  }, [classes, filters]);

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    filteredClasses,
    "name" as keyof ClassItem,
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
  } = useRowSelection(filteredClasses);

  const bulkActions = useMemo(
    () => [
      {
        label: "Activate",
        icon: <Power className="h-4 w-4" />,
        onClick: async (items: ClassItem[]) => {
          const ids = items.map((c) => c._id);
          const result = await bulkToggleClassStatus(ids, true);
          if (result.success) {
            toast.success(`${result.count} classes activated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to activate classes");
          }
        },
      },
      {
        label: "Deactivate",
        icon: <PowerOff className="h-4 w-4" />,
        onClick: async (items: ClassItem[]) => {
          const ids = items.map((c) => c._id);
          const result = await bulkToggleClassStatus(ids, false);
          if (result.success) {
            toast.success(`${result.count} classes deactivated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to deactivate classes");
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: ClassItem[]) => {
          const ids = items.map((c) => c._id);
          const result = await bulkDeleteClasses(ids);
          if (result.success) {
            toast.success(`${result.count} classes deleted`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to delete classes");
          }
        },
      },
    ],
    [clearSelection, router],
  );

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ open: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", name: "" });

    const result = await deleteClass(id);
    if (result.success) {
      toast.success("Class deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete class");
    }
  };

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <Users2 className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No classes yet</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Create your first class to get started.
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
          totalCount={filteredClasses.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <Users2 className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              No classes match your filters.
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
                    <SimpleSortableHeader<ClassItem>
                      label="Name"
                      sortKey="name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>Semester</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Department</TableHead>
                    <SimpleSortableHeader<ClassItem>
                      label="Academic Year"
                      sortKey="academicYear"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((classItem) => (
                    <TableRow
                      key={classItem._id}
                      data-state={
                        isSelected(classItem._id) ? "selected" : undefined
                      }
                      className="group"
                    >
                      <TableCell>
                        <SelectRowCheckbox
                          checked={isSelected(classItem._id)}
                          onCheckedChange={(checked) =>
                            toggleRow(classItem._id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                            <Users2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{classItem.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {classItem.semesterId?.name ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                            <span className="text-sm">
                              {classItem.semesterId.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {classItem.semesterId?.courseId ? (
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="text-muted-foreground h-3.5 w-3.5" />
                            <Badge variant="outline" className="font-mono">
                              {classItem.semesterId.courseId.code}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {classItem.semesterId?.courseId?.departmentId ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                            <span className="text-sm">
                              {classItem.semesterId.courseId.departmentId.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <CalendarRange className="text-muted-foreground h-3.5 w-3.5" />
                          <Badge
                            variant="outline"
                            className="border-violet-500/30 bg-violet-500/10 font-mono text-violet-600"
                          >
                            {classItem.academicYear}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            classItem.isActive
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              : "border-zinc-500/30 bg-zinc-500/10 text-zinc-600"
                          }
                        >
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                              classItem.isActive
                                ? "bg-emerald-500"
                                : "bg-zinc-400"
                            }`}
                          />
                          {classItem.isActive ? "Active" : "Inactive"}
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
                              onClick={() => setEditingClass(classItem)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                handleDeleteClick(classItem._id, classItem.name)
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
              totalItems={filteredClasses.length}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {editingClass && (
        <EditClassDialog
          classItem={editingClass}
          semesters={semesters}
          open={!!editingClass}
          onOpenChange={(open) => !open && setEditingClass(null)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ open: false, id: "", name: "" })
        }
        title="Delete Class"
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
