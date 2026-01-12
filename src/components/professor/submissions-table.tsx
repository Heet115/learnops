"use client";

import { useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  DataTableFilter,
  FilterConfig,
} from "@/components/ui/data-table-filter";
import {
  BulkActionsBar,
  SelectAllCheckbox,
  SelectRowCheckbox,
  useRowSelection,
} from "@/components/ui/bulk-actions";
import {
  DataExportButton,
  type ExportColumn,
} from "@/components/ui/data-export";
import { SaveFiltersButton } from "@/components/ui/save-filters-button";
import { usePersistedFilters } from "@/hooks/use-persisted-filters";
import {
  useTableSort,
  useTablePagination,
  PaginationControls,
  type ColumnDef,
} from "@/components/ui/enhanced-data-table";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Eye,
  CheckCircle,
  XCircle,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  BookMarked,
  GraduationCap,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface Submission {
  _id: string;
  status: string;
  marks?: number;
  adjustedMarks?: number;
  isLate?: boolean;
  latePenaltyApplied?: number;
  submittedAt?: string;
  gradedAt?: string;
  alaId: {
    _id: string;
    title: string;
    maxMarks: number;
    deadline: string;
    isGroupSubmission?: boolean;
    subjectOfferingId?: {
      subjectId?: { name: string; code: string };
      classId?: { name: string };
    };
  };
  studentId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  groupMembers?: {
    firstName: string;
    lastName: string;
  }[];
}

interface SubmissionsTableProps {
  submissions: Submission[];
}

// Export columns
const exportColumns: ExportColumn<Submission>[] = [
  {
    key: "student",
    header: "Student",
    accessor: (row) => `${row.studentId?.firstName} ${row.studentId?.lastName}`,
  },
  {
    key: "email",
    header: "Email",
    accessor: (row) => row.studentId?.email || "",
  },
  { key: "ala", header: "ALA", accessor: (row) => row.alaId?.title || "" },
  {
    key: "subject",
    header: "Subject",
    accessor: (row) => row.alaId?.subjectOfferingId?.subjectId?.code || "",
  },
  {
    key: "class",
    header: "Class",
    accessor: (row) => row.alaId?.subjectOfferingId?.classId?.name || "",
  },
  { key: "status", header: "Status", accessor: (row) => row.status },
  {
    key: "isLate",
    header: "Late",
    accessor: (row) => (row.isLate ? "Yes" : "No"),
  },
  {
    key: "marks",
    header: "Marks",
    accessor: (row) =>
      row.marks !== undefined ? `${row.marks}/${row.alaId?.maxMarks}` : "-",
  },
  {
    key: "adjustedMarks",
    header: "Adjusted Marks",
    accessor: (row) =>
      row.isLate && row.adjustedMarks !== undefined
        ? `${row.adjustedMarks}/${row.alaId?.maxMarks}`
        : "-",
  },
  {
    key: "latePenalty",
    header: "Late Penalty",
    accessor: (row) =>
      row.isLate && row.latePenaltyApplied ? `${row.latePenaltyApplied}%` : "-",
  },
  {
    key: "submittedAt",
    header: "Submitted At",
    accessor: (row) =>
      row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-",
  },
];

// Table columns for sorting
const tableColumns: ColumnDef<Submission>[] = [
  {
    id: "student",
    header: "Student",
    sortable: true,
    accessorFn: (row) =>
      `${row.studentId?.firstName} ${row.studentId?.lastName}`,
  },
  {
    id: "ala",
    header: "ALA",
    sortable: true,
    accessorFn: (row) => row.alaId?.title || "",
  },
  {
    id: "subject",
    header: "Subject",
    sortable: true,
    accessorFn: (row) => row.alaId?.subjectOfferingId?.subjectId?.code || "",
  },
  {
    id: "class",
    header: "Class",
    sortable: true,
    accessorFn: (row) => row.alaId?.subjectOfferingId?.classId?.name || "",
  },
  {
    id: "submittedAt",
    header: "Submitted",
    sortable: true,
    accessorKey: "submittedAt",
  },
  { id: "status", header: "Status", sortable: true, accessorKey: "status" },
];

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  } = usePersistedFilters({
    storageKey: "professor-submissions-filters",
    defaultFilters: { search: "", subject: "", class: "", status: "" },
  });

  const { subjectOptions, classOptions } = useMemo(() => {
    const subjectMap = new Map<string, { label: string; value: string }>();
    const classMap = new Map<string, { label: string; value: string }>();
    submissions.forEach((sub) => {
      const subject = sub.alaId?.subjectOfferingId?.subjectId;
      const cls = sub.alaId?.subjectOfferingId?.classId;
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
  }, [submissions]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by student or ALA...",
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
          { label: "Pending", value: "submitted" },
          { label: "Graded", value: "graded" },
          { label: "Rejected", value: "rejected" },
        ],
      },
    ],
    [subjectOptions, classOptions],
  );

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const subject = filters.subject as string;
      const classFilter = filters.class as string;
      const status = filters.status as string;

      if (search) {
        const studentName =
          `${sub.studentId?.firstName} ${sub.studentId?.lastName}`.toLowerCase();
        const alaTitle = sub.alaId?.title?.toLowerCase() || "";
        if (!studentName.includes(search) && !alaTitle.includes(search))
          return false;
      }

      if (
        subject &&
        subject !== "all" &&
        sub.alaId?.subjectOfferingId?.subjectId?.code !== subject
      )
        return false;
      if (
        classFilter &&
        classFilter !== "all" &&
        sub.alaId?.subjectOfferingId?.classId?.name !== classFilter
      )
        return false;
      if (status && status !== "all" && sub.status !== status) return false;

      return true;
    });
  }, [submissions, filters]);

  // Sorting
  const { sortedData, sortState, toggleSort } = useTableSort(
    filteredSubmissions,
    tableColumns,
  );

  // Pagination
  const {
    paginatedData,
    pagination,
    pageCount,
    canPreviousPage,
    canNextPage,
    goToPage,
    setPageSize,
  } = useTablePagination(sortedData, 10);

  // Selection
  const {
    selectedItems,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    toggleAll,
    toggleRow,
    clearSelection,
    isSelected,
  } = useRowSelection(paginatedData);

  const bulkActions = useMemo(
    () => [
      {
        label: "Export Selected",
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: async (items: Submission[]) => {
          toast.success(`Exported ${items.length} submissions`);
          clearSelection();
        },
      },
    ],
    [clearSelection],
  );

  const getStatusBadge = (
    status: string,
    marks?: number,
    maxMarks?: number,
    isLate?: boolean,
    adjustedMarks?: number,
    latePenaltyApplied?: number,
  ) => {
    switch (status) {
      case "graded":
        return (
          <div className="flex flex-col gap-0.5">
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            >
              <CheckCircle className="mr-1.5 h-3 w-3" />
              {isLate && adjustedMarks !== undefined ? adjustedMarks : marks}/
              {maxMarks}
            </Badge>
            {isLate && latePenaltyApplied && (
              <span className="text-[10px] text-orange-600">
                -{latePenaltyApplied}% late
              </span>
            )}
          </div>
        );
      case "submitted":
        return (
          <div className="flex flex-col gap-0.5">
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600"
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Pending
            </Badge>
            {isLate && (
              <Badge
                variant="outline"
                className="border-orange-500/30 bg-orange-500/10 text-[10px] text-orange-600"
              >
                <Clock className="mr-1 h-2.5 w-2.5" />
                Late
              </Badge>
            )}
          </div>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="border-red-500/30 bg-red-500/10 text-red-600"
          >
            <XCircle className="mr-1.5 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Sortable header renderer
  const renderSortableHeader = (columnId: string, label: string) => {
    const column = tableColumns.find((c) => c.id === columnId);
    if (!column?.sortable) return label;

    const isSorted = sortState.column === columnId;
    const direction = isSorted ? sortState.direction : null;

    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => toggleSort(columnId)}
      >
        {label}
        {direction === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : direction === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    );
  };

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <FileText className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No submissions yet</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Student submissions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />
        <div className="flex items-center gap-2">
          <SaveFiltersButton
            hasActiveFilters={hasActiveFilters}
            hasSavedFilters={hasSavedFilters}
            onSave={saveFilters}
            onReset={resetFilters}
          />
          <DataExportButton
            data={sortedData}
            columns={exportColumns}
            filename="submissions"
            formats={["csv", "excel"]}
          />
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedCount}
        totalCount={paginatedData.length}
        actions={bulkActions}
        selectedItems={selectedItems}
        onClearSelection={clearSelection}
      />

      {sortedData.length === 0 ? (
        <IllustratedEmpty
          preset="noResults"
          size="sm"
          action={{
            label: "Clear filters",
            onClick: () =>
              setFilters({
                search: "",
                subject: "",
                class: "",
                status: "",
              }),
            variant: "outline",
          }}
        />
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
                    {renderSortableHeader("student", "Student")}
                  </TableHead>
                  <TableHead className="min-w-[140px]">
                    {renderSortableHeader("ala", "ALA")}
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    {renderSortableHeader("subject", "Subject")}
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    {renderSortableHeader("class", "Class")}
                  </TableHead>
                  <TableHead className="min-w-[130px]">
                    {renderSortableHeader("submittedAt", "Submitted")}
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    {renderSortableHeader("status", "Status")}
                  </TableHead>
                  <TableHead className="w-[80px] min-w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((sub) => {
                  const isGroup =
                    sub.alaId?.isGroupSubmission &&
                    sub.groupMembers &&
                    sub.groupMembers.length > 0;
                  const allMembers = isGroup
                    ? [sub.studentId, ...(sub.groupMembers || [])]
                    : [sub.studentId];

                  return (
                    <TableRow
                      key={sub._id}
                      className="group"
                      data-state={isSelected(sub._id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <SelectRowCheckbox
                          checked={isSelected(sub._id)}
                          onCheckedChange={(checked) =>
                            toggleRow(sub._id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={`${sub.studentId?.firstName} ${sub.studentId?.lastName}`}
                            size="sm"
                          />
                          <div>
                            {isGroup ? (
                              <>
                                <div className="mb-0.5 flex items-center gap-1">
                                  <Users className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-600">
                                    Group ({allMembers.length})
                                  </span>
                                </div>
                                <p className="text-sm font-medium">
                                  {sub.studentId?.firstName}{" "}
                                  {sub.studentId?.lastName}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">
                                  {sub.studentId?.firstName}{" "}
                                  {sub.studentId?.lastName}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {sub.studentId?.email}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="max-w-[140px] truncate text-sm">
                            {sub.alaId?.title || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-violet-500/30 bg-violet-500/10 text-violet-600"
                        >
                          <BookMarked className="mr-1.5 h-3 w-3" />
                          {sub.alaId?.subjectOfferingId?.subjectId?.code || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                          {sub.alaId?.subjectOfferingId?.classId?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground flex items-center gap-1.5 text-sm tabular-nums">
                          <Calendar className="h-3.5 w-3.5" />
                          {sub.submittedAt
                            ? new Date(sub.submittedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                },
                              )
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(
                          sub.status,
                          sub.marks,
                          sub.alaId?.maxMarks,
                          sub.isLate,
                          sub.adjustedMarks,
                          sub.latePenaltyApplied,
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                          asChild
                        >
                          <Link href={`/professor/submissions/${sub._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            pageCount={pageCount}
            totalItems={sortedData.length}
            canPreviousPage={canPreviousPage}
            canNextPage={canNextPage}
            onPageChange={goToPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
