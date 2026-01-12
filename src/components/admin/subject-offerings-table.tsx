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
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  BookOpen,
  User,
  GraduationCap,
  Building2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  deleteSubjectOffering,
  bulkDeleteSubjectOfferings,
  bulkToggleSubjectOfferingStatus,
} from "@/lib/actions/academic.actions";
import { toast } from "sonner";
import { EditSubjectOfferingDialog } from "./edit-subject-offering-dialog";

interface SubjectOffering {
  _id: string;
  academicYear: string;
  isActive: boolean;
  subjectId: {
    _id: string;
    name: string;
    code: string;
    credits: number;
  };
  classId: {
    _id: string;
    name: string;
    academicYear: string;
  };
  professorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
}

interface SortableSubjectOffering extends SubjectOffering {
  subjectCode: string;
  className: string;
  professorName: string;
  semesterName: string;
  statusLabel: string;
}

interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SubjectOfferingsTableProps {
  offerings: SubjectOffering[];
  professors: Professor[];
}

export function SubjectOfferingsTable({
  offerings,
  professors,
}: SubjectOfferingsTableProps) {
  const [editingOffering, setEditingOffering] =
    useState<SubjectOffering | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  } = usePersistedFilters({
    storageKey: "admin-subject-offerings-filters",
    defaultFilters: {
      search: "",
      professor: "",
      department: "",
      academicYear: "",
      status: "",
    },
  });

  const { professorOptions, departmentOptions, yearOptions } = useMemo(() => {
    const profOpts = professors.map((p) => ({
      label: `${p.firstName} ${p.lastName}`,
      value: p._id,
    }));
    const deptMap = new Map<string, { label: string; value: string }>();
    const yearSet = new Set<string>();
    offerings.forEach((off) => {
      const dept = off.semesterId?.courseId?.departmentId;
      if (dept) {
        deptMap.set(dept.code, {
          label: `${dept.code} - ${dept.name}`,
          value: dept.code,
        });
      }
      if (off.academicYear) yearSet.add(off.academicYear);
    });
    const yearOpts = Array.from(yearSet)
      .sort()
      .reverse()
      .map((y) => ({ label: y, value: y }));
    return {
      professorOptions: profOpts,
      departmentOptions: Array.from(deptMap.values()),
      yearOptions: yearOpts,
    };
  }, [professors, offerings]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by subject...",
      },
      {
        key: "professor",
        label: "Professor",
        type: "select",
        options: professorOptions,
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
    [professorOptions, departmentOptions, yearOptions],
  );

  const filteredOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const professor = filters.professor as string;
      const department = filters.department as string;
      const academicYear = filters.academicYear as string;
      const status = filters.status as string;

      if (search) {
        const subjectName = offering.subjectId?.name?.toLowerCase() || "";
        const subjectCode = offering.subjectId?.code?.toLowerCase() || "";
        if (!subjectName.includes(search) && !subjectCode.includes(search))
          return false;
      }

      if (
        professor &&
        professor !== "all" &&
        offering.professorId?._id !== professor
      )
        return false;
      if (
        department &&
        department !== "all" &&
        offering.semesterId?.courseId?.departmentId?.code !== department
      )
        return false;
      if (
        academicYear &&
        academicYear !== "all" &&
        offering.academicYear !== academicYear
      )
        return false;

      if (status && status !== "all") {
        if (status === "active" && !offering.isActive) return false;
        if (status === "inactive" && offering.isActive) return false;
      }

      return true;
    });
  }, [offerings, filters]);

  const offeringsWithSortFields = useMemo(() => {
    return filteredOfferings.map((off) => ({
      ...off,
      subjectCode: off.subjectId?.code || "",
      className: off.classId?.name || "",
      professorName:
        `${off.professorId?.firstName || ""} ${off.professorId?.lastName || ""}`.trim(),
      semesterName: off.semesterId?.name || "",
      statusLabel: off.isActive ? "Active" : "Inactive",
    }));
  }, [filteredOfferings]);

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    offeringsWithSortFields,
    "academicYear" as keyof (typeof offeringsWithSortFields)[0],
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
  } = useRowSelection(filteredOfferings);

  const bulkActions = useMemo(
    () => [
      {
        label: "Activate",
        icon: <Power className="h-4 w-4" />,
        onClick: async (items: SubjectOffering[]) => {
          const ids = items.map((o) => o._id);
          const result = await bulkToggleSubjectOfferingStatus(ids, true);
          if (result.success) {
            toast.success(`${result.count} offerings activated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to activate offerings");
          }
        },
      },
      {
        label: "Deactivate",
        icon: <PowerOff className="h-4 w-4" />,
        onClick: async (items: SubjectOffering[]) => {
          const ids = items.map((o) => o._id);
          const result = await bulkToggleSubjectOfferingStatus(ids, false);
          if (result.success) {
            toast.success(`${result.count} offerings deactivated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to deactivate offerings");
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: SubjectOffering[]) => {
          const ids = items.map((o) => o._id);
          const result = await bulkDeleteSubjectOfferings(ids);
          if (result.success) {
            toast.success(`${result.count} offerings deleted`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to delete offerings");
          }
        },
      },
    ],
    [clearSelection, router],
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);

    const result = await deleteSubjectOffering(deleteId);

    if (result.success) {
      toast.success("Subject offering deleted successfully");
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete subject offering");
    }

    setIsLoading(false);
  };

  if (offerings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <BookOpen className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No subject offerings yet</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Create your first assignment to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
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
          totalCount={filteredOfferings.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredOfferings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <BookOpen className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              No subject offerings match your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
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
                    <SimpleSortableHeader<SortableSubjectOffering>
                      label="Subject"
                      sortKey="subjectCode"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<SortableSubjectOffering>
                      label="Class"
                      sortKey="className"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<SortableSubjectOffering>
                      label="Professor"
                      sortKey="professorName"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<SortableSubjectOffering>
                      label="Semester"
                      sortKey="semesterName"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<SortableSubjectOffering>
                      label="Academic Year"
                      sortKey="academicYear"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<SortableSubjectOffering>
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
                  {paginatedData.map((offering) => (
                    <TableRow
                      key={offering._id}
                      data-state={
                        isSelected(offering._id) ? "selected" : undefined
                      }
                      className="group"
                    >
                      <TableCell>
                        <SelectRowCheckbox
                          checked={isSelected(offering._id)}
                          onCheckedChange={(checked) =>
                            toggleRow(offering._id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="font-mono">
                                {offering.subjectId?.code}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {offering.subjectId?.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                          <span>{offering.classId?.name || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10">
                            <User className="h-3.5 w-3.5 text-violet-600" />
                          </div>
                          <div>
                            <span className="font-medium">
                              {offering.professorId?.firstName}{" "}
                              {offering.professorId?.lastName}
                            </span>
                            <p className="text-muted-foreground text-xs">
                              {offering.professorId?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span>{offering.semesterId?.name}</span>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Building2 className="h-3 w-3" />
                            {
                              offering.semesterId?.courseId?.departmentId?.code
                            }{" "}
                            - {offering.semesterId?.courseId?.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                          <span className="tabular-nums">
                            {offering.academicYear}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            offering.isActive
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              : "border-zinc-500/30 bg-zinc-500/10 text-zinc-600"
                          }
                        >
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                              offering.isActive
                                ? "bg-emerald-500"
                                : "bg-zinc-400"
                            }`}
                          />
                          {offering.isActive ? "Active" : "Inactive"}
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
                              onClick={() => setEditingOffering(offering)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(offering._id)}
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
              totalItems={filteredOfferings.length}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {editingOffering && (
        <EditSubjectOfferingDialog
          offering={editingOffering}
          professors={professors}
          open={!!editingOffering}
          onOpenChange={(open) => !open && setEditingOffering(null)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-full">
                <AlertTriangle className="text-destructive h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle>Delete Subject Offering</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this subject offering? This
                  action cannot be undone.
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
