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
  BookMarked,
  Calendar,
  BookOpen,
  Building2,
  Award,
} from "lucide-react";
import {
  deleteSubject,
  bulkDeleteSubjects,
  bulkToggleSubjectStatus,
} from "@/lib/actions/academic.actions";
import { toast } from "sonner";
import { EditSubjectDialog } from "./edit-subject-dialog";

interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
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

interface SubjectsTableProps {
  subjects: Subject[];
  semesters: Semester[];
}

export function SubjectsTable({ subjects, semesters }: SubjectsTableProps) {
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
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
    status: "",
  });

  const { semesterOptions, departmentOptions } = useMemo(() => {
    const semOpts = semesters.map((s) => ({
      label: `${s.name} - ${s.courseId?.code || ""}`,
      value: s._id,
    }));
    const deptMap = new Map<string, { label: string; value: string }>();
    subjects.forEach((sub) => {
      const dept = sub.semesterId?.courseId?.departmentId;
      if (dept) {
        deptMap.set(dept.code, {
          label: `${dept.code} - ${dept.name}`,
          value: dept.code,
        });
      }
    });
    return {
      semesterOptions: semOpts,
      departmentOptions: Array.from(deptMap.values()),
    };
  }, [semesters, subjects]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name or code...",
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
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
    ],
    [semesterOptions, departmentOptions],
  );

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const semester = filters.semester as string;
      const department = filters.department as string;
      const status = filters.status as string;

      if (search) {
        if (
          !subject.name.toLowerCase().includes(search) &&
          !subject.code.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      if (
        semester &&
        semester !== "all" &&
        subject.semesterId?._id !== semester
      )
        return false;
      if (
        department &&
        department !== "all" &&
        subject.semesterId?.courseId?.departmentId?.code !== department
      )
        return false;

      if (status && status !== "all") {
        if (status === "active" && !subject.isActive) return false;
        if (status === "inactive" && subject.isActive) return false;
      }

      return true;
    });
  }, [subjects, filters]);

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    filteredSubjects,
    "code" as keyof Subject,
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
  } = useRowSelection(filteredSubjects);

  const bulkActions = useMemo(
    () => [
      {
        label: "Activate",
        icon: <Power className="h-4 w-4" />,
        onClick: async (items: Subject[]) => {
          const ids = items.map((s) => s._id);
          const result = await bulkToggleSubjectStatus(ids, true);
          if (result.success) {
            toast.success(`${result.count} subjects activated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to activate subjects");
          }
        },
      },
      {
        label: "Deactivate",
        icon: <PowerOff className="h-4 w-4" />,
        onClick: async (items: Subject[]) => {
          const ids = items.map((s) => s._id);
          const result = await bulkToggleSubjectStatus(ids, false);
          if (result.success) {
            toast.success(`${result.count} subjects deactivated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to deactivate subjects");
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: Subject[]) => {
          const ids = items.map((s) => s._id);
          const result = await bulkDeleteSubjects(ids);
          if (result.success) {
            toast.success(`${result.count} subjects deleted`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to delete subjects");
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

    const result = await deleteSubject(id);
    if (result.success) {
      toast.success("Subject deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete subject");
    }
  };

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <BookMarked className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No subjects yet</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Create your first subject to get started.
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
          totalCount={filteredSubjects.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <BookMarked className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              No subjects match your filters.
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
                    <SimpleSortableHeader<Subject>
                      label="Code"
                      sortKey="code"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<Subject>
                      label="Name"
                      sortKey="name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>Semester</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Department</TableHead>
                    <SimpleSortableHeader<Subject>
                      label="Credits"
                      sortKey="credits"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((subject) => (
                    <TableRow
                      key={subject._id}
                      data-state={
                        isSelected(subject._id) ? "selected" : undefined
                      }
                      className="group"
                    >
                      <TableCell>
                        <SelectRowCheckbox
                          checked={isSelected(subject._id)}
                          onCheckedChange={(checked) =>
                            toggleRow(subject._id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                            <BookMarked className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-mono font-semibold">
                            {subject.code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate font-medium">
                        {subject.name}
                      </TableCell>
                      <TableCell>
                        {subject.semesterId?.name ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                            <span className="text-sm">
                              {subject.semesterId.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subject.semesterId?.courseId ? (
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="text-muted-foreground h-3.5 w-3.5" />
                            <Badge variant="outline" className="font-mono">
                              {subject.semesterId.courseId.code}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subject.semesterId?.courseId?.departmentId ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                            <span className="text-sm">
                              {subject.semesterId.courseId.departmentId.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Award className="text-muted-foreground h-3.5 w-3.5" />
                          <Badge
                            variant="outline"
                            className="border-violet-500/30 bg-violet-500/10 font-mono text-violet-600"
                          >
                            {subject.credits}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            subject.isActive
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              : "border-zinc-500/30 bg-zinc-500/10 text-zinc-600"
                          }
                        >
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                              subject.isActive
                                ? "bg-emerald-500"
                                : "bg-zinc-400"
                            }`}
                          />
                          {subject.isActive ? "Active" : "Inactive"}
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
                              onClick={() => setEditingSubject(subject)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                handleDeleteClick(subject._id, subject.name)
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
              totalItems={filteredSubjects.length}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {editingSubject && (
        <EditSubjectDialog
          subject={editingSubject}
          semesters={semesters}
          open={!!editingSubject}
          onOpenChange={(open) => !open && setEditingSubject(null)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ open: false, id: "", name: "" })
        }
        title="Delete Subject"
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
