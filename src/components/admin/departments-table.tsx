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
  deleteDepartment,
  bulkDeleteDepartments,
  bulkToggleDepartmentStatus,
} from "@/lib/actions/academic.actions";
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Power,
  PowerOff,
  Building2,
  UserCheck,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { IDepartment, IUser } from "@/lib/db";
import { EditDepartmentDialog } from "./edit-department-dialog";
import { toast } from "sonner";

interface DepartmentsTableProps {
  departments: (IDepartment & { hodId?: IUser })[];
  hods: IUser[];
}

const filterConfigs: FilterConfig[] = [
  {
    key: "search",
    label: "Search",
    type: "text",
    placeholder: "Search by name or code...",
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
  {
    key: "hasHod",
    label: "HOD Assigned",
    type: "select",
    options: [
      { label: "Assigned", value: "yes" },
      { label: "Not Assigned", value: "no" },
    ],
  },
];

export function DepartmentsTable({ departments, hods }: DepartmentsTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editDepartment, setEditDepartment] = useState<IDepartment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    status: "",
    hasHod: "",
  });

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const status = filters.status as string;
      const hasHod = filters.hasHod as string;
      const hod = dept.hodId as unknown as IUser | undefined;

      if (search) {
        if (
          !dept.name.toLowerCase().includes(search) &&
          !dept.code.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      if (status && status !== "all") {
        if (status === "active" && !dept.isActive) return false;
        if (status === "inactive" && dept.isActive) return false;
      }

      if (hasHod && hasHod !== "all") {
        if (hasHod === "yes" && !hod) return false;
        if (hasHod === "no" && hod) return false;
      }

      return true;
    });
  }, [departments, filters]);

  const departmentsWithStringId = useMemo(
    () =>
      filteredDepartments.map((d) => ({
        ...d,
        _id: (d._id as unknown as { toString(): string }).toString(),
      })),
    [filteredDepartments],
  );

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    departmentsWithStringId,
    "code" as keyof (typeof departmentsWithStringId)[0],
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
  } = useRowSelection(departmentsWithStringId);

  const bulkActions = useMemo(
    () => [
      {
        label: "Activate",
        icon: <Power className="h-4 w-4" />,
        onClick: async (items: typeof departmentsWithStringId) => {
          const ids = items.map((d) => d._id);
          const result = await bulkToggleDepartmentStatus(ids, true);
          if (result.success) {
            toast.success(`${result.count} departments activated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to activate departments");
          }
        },
      },
      {
        label: "Deactivate",
        icon: <PowerOff className="h-4 w-4" />,
        onClick: async (items: typeof departmentsWithStringId) => {
          const ids = items.map((d) => d._id);
          const result = await bulkToggleDepartmentStatus(ids, false);
          if (result.success) {
            toast.success(`${result.count} departments deactivated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to deactivate departments");
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: typeof departmentsWithStringId) => {
          const ids = items.map((d) => d._id);
          const result = await bulkDeleteDepartments(ids);
          if (result.success) {
            toast.success(`${result.count} departments deleted`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to delete departments");
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

    const result = await deleteDepartment(deleteId);

    if (result.success) {
      toast.success("Department deleted successfully");
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete department");
      setError(result.error || "Failed to delete");
    }

    setIsLoading(false);
  };

  if (departments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No departments yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first department to get started.
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
          totalCount={departmentsWithStringId.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredDepartments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No departments match your filters.
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
                    <SimpleSortableHeader<(typeof departmentsWithStringId)[0]>
                      label="Code"
                      sortKey="code"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<(typeof departmentsWithStringId)[0]>
                      label="Name"
                      sortKey="name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>HOD</TableHead>
                    <SimpleSortableHeader<(typeof departmentsWithStringId)[0]>
                      label="Status"
                      sortKey="isActive"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SimpleSortableHeader<(typeof departmentsWithStringId)[0]>
                      label="Created"
                      sortKey="createdAt"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((dept) => {
                    const hod = dept.hodId as unknown as IUser | undefined;
                    return (
                      <TableRow
                        key={dept._id}
                        data-state={isSelected(dept._id) ? "selected" : undefined}
                        className="group"
                      >
                        <TableCell>
                          <SelectRowCheckbox
                            checked={isSelected(dept._id)}
                            onCheckedChange={(checked) =>
                              toggleRow(dept._id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-mono font-semibold">
                              {dept.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>
                          {hod ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10 text-xs font-medium text-violet-600">
                                {hod.firstName?.[0]}
                                {hod.lastName?.[0]}
                              </div>
                              <span className="text-sm">
                                {hod.firstName} {hod.lastName}
                              </span>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600"
                            >
                              <UserCheck className="h-3 w-3" />
                              Not assigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              dept.isActive
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                : "border-zinc-500/30 bg-zinc-500/10 text-zinc-600"
                            }
                          >
                            <span
                              className={`inline-block mr-1.5 h-1.5 w-1.5 rounded-full ${
                                dept.isActive ? "bg-emerald-500" : "bg-zinc-400"
                              }`}
                            />
                            {dept.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="tabular-nums">
                              {new Date(dept.createdAt).toLocaleDateString()}
                            </span>
                          </div>
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
                                onClick={() =>
                                  setEditDepartment(dept as unknown as IDepartment)
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(dept._id)}
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
              totalItems={departmentsWithStringId.length}
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
                <AlertDialogTitle>Delete Department</AlertDialogTitle>
                <AlertDialogDescription>
                  {error ||
                    "Are you sure? This action cannot be undone. Departments with courses cannot be deleted."}
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

      {editDepartment && (
        <EditDepartmentDialog
          department={editDepartment}
          hods={hods}
          open={!!editDepartment}
          onOpenChange={(open) => !open && setEditDepartment(null)}
        />
      )}
    </>
  );
}
