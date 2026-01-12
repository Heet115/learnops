"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Lock,
  Unlock,
  Eye,
  Users,
  FileText,
  Calendar,
  Award,
  BookMarked,
  GraduationCap,
  Clock,
} from "lucide-react";
import {
  deleteALA,
  toggleALALock,
  bulkLockALAs,
  bulkUnlockALAs,
  bulkDeleteALAs,
} from "@/lib/actions/ala.actions";
import { toast } from "sonner";
import { EditALADialog } from "./edit-ala-dialog";

interface ALA {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  isGroupSubmission: boolean;
  maxGroupSize?: number;
  isLocked: boolean;
  allowLateSubmission?: boolean;
  lateDeadline?: string;
  latePenaltyPercent?: number;
  subjectOfferingId: {
    _id: string;
    subjectId: { name: string; code: string };
    classId: { name: string };
    semesterId: { name: string };
    academicYear: string;
  };
}

interface SortableALA extends ALA {
  subjectCode: string;
  className: string;
  type: string;
  statusLabel: string;
}

interface ALAsTableProps {
  alas: ALA[];
}

export function ALAsTable({ alas }: ALAsTableProps) {
  const [editingALA, setEditingALA] = useState<ALA | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({
    open: false,
    id: "",
    title: "",
  });
  const router = useRouter();
  const {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  } = usePersistedFilters({
    storageKey: "professor-alas-filters",
    defaultFilters: {
      search: "",
      subject: "",
      class: "",
      status: "",
      type: "",
    },
  });

  const { subjectOptions, classOptions } = useMemo(() => {
    const subjectMap = new Map<string, { label: string; value: string }>();
    const classMap = new Map<string, { label: string; value: string }>();
    alas.forEach((ala) => {
      const subject = ala.subjectOfferingId?.subjectId;
      const cls = ala.subjectOfferingId?.classId;
      if (subject) {
        subjectMap.set(subject.code, {
          label: `${subject.code} - ${subject.name}`,
          value: subject.code,
        });
      }
      if (cls) {
        classMap.set(cls.name, { label: cls.name, value: cls.name });
      }
    });
    return {
      subjectOptions: Array.from(subjectMap.values()),
      classOptions: Array.from(classMap.values()),
    };
  }, [alas]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by title...",
      },
      {
        key: "subject",
        label: "Subject",
        type: "select",
        options: subjectOptions,
      },
      { key: "class", label: "Class", type: "select", options: classOptions },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Locked", value: "locked" },
          { label: "Past Due", value: "past" },
        ],
      },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          { label: "Individual", value: "individual" },
          { label: "Group", value: "group" },
        ],
      },
    ],
    [subjectOptions, classOptions],
  );

  const getStatus = (ala: ALA) => {
    if (ala.isLocked) return { label: "Locked", color: "violet" };
    const now = new Date();
    const deadline = new Date(ala.deadline);
    const lateDeadline = ala.lateDeadline ? new Date(ala.lateDeadline) : null;

    // Check if in late submission window
    if (
      ala.allowLateSubmission &&
      lateDeadline &&
      deadline < now &&
      lateDeadline > now
    ) {
      return { label: "Late Window", color: "orange" };
    }
    if (deadline < now) return { label: "Past Due", color: "amber" };
    return { label: "Active", color: "emerald" };
  };

  const filteredALAs = useMemo(() => {
    const search = (filters.search as string)?.toLowerCase() || "";
    const subject = filters.subject as string;
    const classFilter = filters.class as string;
    const status = filters.status as string;
    const type = filters.type as string;

    return alas.filter((ala) => {
      if (search && !ala.title.toLowerCase().includes(search)) return false;
      if (
        subject &&
        subject !== "all" &&
        ala.subjectOfferingId?.subjectId?.code !== subject
      )
        return false;
      if (
        classFilter &&
        classFilter !== "all" &&
        ala.subjectOfferingId?.classId?.name !== classFilter
      )
        return false;

      if (status && status !== "all") {
        const alaStatus = getStatus(ala);
        if (status === "active" && alaStatus.label !== "Active") return false;
        if (status === "locked" && alaStatus.label !== "Locked") return false;
        if (status === "past" && alaStatus.label !== "Past Due") return false;
      }

      if (type && type !== "all") {
        if (type === "individual" && ala.isGroupSubmission) return false;
        if (type === "group" && !ala.isGroupSubmission) return false;
      }

      return true;
    });
  }, [alas, filters]);

  const alasWithSortFields = useMemo((): SortableALA[] => {
    return filteredALAs.map((ala) => ({
      ...ala,
      subjectCode: ala.subjectOfferingId?.subjectId?.code || "",
      className: ala.subjectOfferingId?.classId?.name || "",
      type: ala.isGroupSubmission ? "Group" : "Individual",
      statusLabel: getStatus(ala).label,
    }));
  }, [filteredALAs]);

  // Sorting
  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    alasWithSortFields,
    "deadline" as keyof SortableALA,
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
  } = useRowSelection(filteredALAs);

  const bulkActions = useMemo(
    () => [
      {
        label: "Lock",
        icon: <Lock className="h-4 w-4" />,
        onClick: async (items: ALA[]) => {
          const ids = items.map((a) => a._id);
          const result = await bulkLockALAs(ids);
          if (result.success) {
            toast.success(`${result.count} ALAs locked`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to lock ALAs");
          }
        },
      },
      {
        label: "Unlock",
        icon: <Unlock className="h-4 w-4" />,
        onClick: async (items: ALA[]) => {
          const ids = items.map((a) => a._id);
          const result = await bulkUnlockALAs(ids);
          if (result.success) {
            toast.success(`${result.count} ALAs unlocked`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to unlock ALAs");
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: ALA[]) => {
          const ids = items.map((a) => a._id);
          const result = await bulkDeleteALAs(ids);
          if (result.success) {
            toast.success(`${result.count} ALAs deleted`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to delete ALAs");
          }
        },
      },
    ],
    [clearSelection, router],
  );

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteConfirm({ open: true, id, title });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", title: "" });

    const result = await deleteALA(id);
    if (result.success) {
      toast.success("ALA deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete ALA");
    }
  };

  const handleToggleLock = async (id: string) => {
    const result = await toggleALALock(id);
    if (result.success) {
      toast.success(result.isLocked ? "ALA locked" : "ALA unlocked");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to toggle lock");
    }
  };

  const statusColorMap: Record<string, string> = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-600",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-600",
  };

  const statusDotMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    orange: "bg-orange-500",
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (alas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <FileText className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No ALAs created yet</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Create your first ALA to get started.
        </p>
      </div>
    );
  }

  return (
    <>
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

        <BulkActionsBar
          selectedCount={selectedCount}
          totalCount={filteredALAs.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredALAs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <FileText className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              No ALAs match your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px] min-w-[50px]">
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
                    <TableHead className="min-w-[180px]">
                      <SimpleSortableHeader<SortableALA>
                        label="Title"
                        sortKey="title"
                        currentSortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <SimpleSortableHeader<SortableALA>
                        label="Subject"
                        sortKey="subjectCode"
                        currentSortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <SimpleSortableHeader<SortableALA>
                        label="Class"
                        sortKey="className"
                        currentSortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      <SimpleSortableHeader<SortableALA>
                        label="Deadline"
                        sortKey="deadline"
                        currentSortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="min-w-[80px]">
                      <SimpleSortableHeader<SortableALA>
                        label="Marks"
                        sortKey="maxMarks"
                        currentSortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <SimpleSortableHeader<SortableALA>
                        label="Type"
                        sortKey="type"
                        currentSortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <SimpleSortableHeader<SortableALA>
                        label="Status"
                        sortKey="statusLabel"
                        currentSortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[70px] min-w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((ala) => {
                    const status = getStatus(ala);
                    return (
                      <TableRow
                        key={ala._id}
                        className="group"
                        data-state={
                          isSelected(ala._id) ? "selected" : undefined
                        }
                      >
                        <TableCell>
                          <SelectRowCheckbox
                            checked={isSelected(ala._id)}
                            onCheckedChange={(checked) =>
                              toggleRow(ala._id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="max-w-[180px] truncate font-medium">
                              {ala.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-violet-500/30 bg-violet-500/10 text-violet-600"
                          >
                            <BookMarked className="mr-1.5 h-3 w-3" />
                            {ala.subjectOfferingId?.subjectId?.code || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                            {ala.subjectOfferingId?.classId?.name || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-muted-foreground flex items-center gap-1.5 text-sm tabular-nums">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDeadline(ala.deadline)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                          >
                            <Award className="mr-1.5 h-3 w-3" />
                            {ala.maxMarks}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ala.isGroupSubmission ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600"
                            >
                              <Users className="h-3 w-3" />
                              Group ({ala.maxGroupSize})
                            </Badge>
                          ) : (
                            <Badge variant="outline">Individual</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={statusColorMap[status.color]}
                            >
                              <span
                                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusDotMap[status.color]}`}
                              />
                              {status.label}
                            </Badge>
                            {ala.allowLateSubmission && (
                              <span className="flex items-center gap-1 text-[10px] text-orange-600">
                                <Clock className="h-2.5 w-2.5" />
                                Late: -{ala.latePenaltyPercent}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/professor/alas/${ala._id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setEditingALA(ala)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleLock(ala._id)}
                              >
                                {ala.isLocked ? (
                                  <>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Unlock
                                  </>
                                ) : (
                                  <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Lock
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  handleDeleteClick(ala._id, ala.title)
                                }
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
              totalItems={filteredALAs.length}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {editingALA && (
        <EditALADialog
          ala={editingALA}
          open={!!editingALA}
          onOpenChange={(open) => !open && setEditingALA(null)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ open: false, id: "", title: "" })
        }
        title="Delete ALA"
        description={`Delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
