"use client";

import { useMemo, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
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
import { DataExportButton, type ExportColumn } from "@/components/ui/data-export";
import { FilterPresetsDropdown } from "@/components/ui/filter-presets";
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
  Clock,
  CheckCircle,
  XCircle,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

interface Submission {
  _id: string;
  status: string;
  marks?: number;
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
  { key: "student", header: "Student", accessor: (row) => `${row.studentId?.firstName} ${row.studentId?.lastName}` },
  { key: "email", header: "Email", accessor: (row) => row.studentId?.email || "" },
  { key: "ala", header: "ALA", accessor: (row) => row.alaId?.title || "" },
  { key: "subject", header: "Subject", accessor: (row) => row.alaId?.subjectOfferingId?.subjectId?.code || "" },
  { key: "class", header: "Class", accessor: (row) => row.alaId?.subjectOfferingId?.classId?.name || "" },
  { key: "status", header: "Status", accessor: (row) => row.status },
  { key: "marks", header: "Marks", accessor: (row) => row.marks !== undefined ? `${row.marks}/${row.alaId?.maxMarks}` : "-" },
  { key: "submittedAt", header: "Submitted At", accessor: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-" },
];

// Table columns for sorting
const tableColumns: ColumnDef<Submission>[] = [
  { id: "student", header: "Student", sortable: true, accessorFn: (row) => `${row.studentId?.firstName} ${row.studentId?.lastName}` },
  { id: "ala", header: "ALA", sortable: true, accessorFn: (row) => row.alaId?.title || "" },
  { id: "subject", header: "Subject", sortable: true, accessorFn: (row) => row.alaId?.subjectOfferingId?.subjectId?.code || "" },
  { id: "class", header: "Class", sortable: true, accessorFn: (row) => row.alaId?.subjectOfferingId?.classId?.name || "" },
  { id: "submittedAt", header: "Submitted", sortable: true, accessorKey: "submittedAt" },
  { id: "status", header: "Status", sortable: true, accessorKey: "status" },
];

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    subject: "",
    class: "",
    status: "",
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

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([, v]) => v && v !== "" && v !== "all");
  }, [filters]);

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
  const { sortedData, sortState, toggleSort } = useTableSort(filteredSubmissions, tableColumns);

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
    [clearSelection]
  );

  const getStatusBadge = (
    status: string,
    marks?: number,
    maxMarks?: number,
  ) => {
    switch (status) {
      case "graded":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            {marks}/{maxMarks}
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
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
      <Card>
        <CardContent className="py-8">
          <IllustratedEmpty
            preset="noSubmissions"
            size="md"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <DataTableFilter
              filters={filterConfigs}
              values={filters}
              onChange={setFilters}
            />
            <div className="flex items-center gap-2">
              <FilterPresetsDropdown
                tableId="professor-submissions"
                currentFilters={filters}
                onApplyPreset={setFilters}
                hasActiveFilters={hasActiveFilters}
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
                onClick: () => setFilters({ search: "", subject: "", class: "", status: "" }),
                variant: "outline",
              }}
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <SelectAllCheckbox
                          checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>{renderSortableHeader("student", "Student")}</TableHead>
                      <TableHead>{renderSortableHeader("ala", "ALA")}</TableHead>
                      <TableHead>{renderSortableHeader("subject", "Subject")}</TableHead>
                      <TableHead>{renderSortableHeader("class", "Class")}</TableHead>
                      <TableHead>{renderSortableHeader("submittedAt", "Submitted")}</TableHead>
                      <TableHead>{renderSortableHeader("status", "Status")}</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
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
                          data-state={isSelected(sub._id) ? "selected" : undefined}
                          className="transition-colors"
                        >
                          <TableCell>
                            <SelectRowCheckbox
                              checked={isSelected(sub._id)}
                              onCheckedChange={(checked) => toggleRow(sub._id, checked)}
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
                                      <Users className="text-muted-foreground h-3 w-3" />
                                      <span className="text-muted-foreground text-xs">
                                        Group ({allMembers.length})
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium">
                                      {sub.studentId?.firstName} {sub.studentId?.lastName}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium">
                                      {sub.studentId?.firstName} {sub.studentId?.lastName}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {sub.studentId?.email}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {sub.alaId?.title || "Unknown"}
                          </TableCell>
                          <TableCell>
                            {sub.alaId?.subjectOfferingId?.subjectId?.code || "-"}
                          </TableCell>
                          <TableCell>
                            {sub.alaId?.subjectOfferingId?.classId?.name || "-"}
                          </TableCell>
                          <TableCell className="tabular-nums">
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
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(
                              sub.status,
                              sub.marks,
                              sub.alaId?.maxMarks,
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" asChild>
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
      </CardContent>
    </Card>
  );
}
