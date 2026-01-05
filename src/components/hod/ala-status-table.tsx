"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
import {
  useSimpleSort,
  useTablePagination,
  SimpleSortableHeader,
  PaginationControls,
} from "@/components/ui/enhanced-data-table";
import {
  DataExportButton,
  type ExportColumn,
} from "@/components/ui/data-export";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import { Clock, CheckCircle, Lock, AlertCircle } from "lucide-react";

interface ALAStatus {
  _id: string;
  title: string;
  subject: string;
  class: string;
  deadline: string;
  isLocked: boolean;
  isPast: boolean;
  submitted: number;
  graded: number;
  pending: number;
  total: number;
}

interface ALAStatusTableProps {
  data: ALAStatus[];
}

export function ALAStatusTable({ data }: ALAStatusTableProps) {
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    subject: "",
    class: "",
    status: "",
  });

  const { subjectOptions, classOptions } = useMemo(() => {
    const subjects = new Set(data.map((d) => d.subject));
    const classes = new Set(data.map((d) => d.class));
    return {
      subjectOptions: Array.from(subjects).map((s) => ({ label: s, value: s })),
      classOptions: Array.from(classes).map((c) => ({ label: c, value: c })),
    };
  }, [data]);

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
          { label: "Overdue", value: "overdue" },
        ],
      },
    ],
    [subjectOptions, classOptions],
  );

  const filteredData = useMemo(() => {
    return data.filter((ala) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const subject = filters.subject as string;
      const classFilter = filters.class as string;
      const status = filters.status as string;

      if (search && !ala.title.toLowerCase().includes(search)) return false;
      if (subject && subject !== "all" && ala.subject !== subject) return false;
      if (classFilter && classFilter !== "all" && ala.class !== classFilter)
        return false;

      if (status && status !== "all") {
        if (status === "active" && (ala.isLocked || ala.isPast)) return false;
        if (status === "locked" && !ala.isLocked) return false;
        if (status === "overdue" && !ala.isPast) return false;
      }

      return true;
    });
  }, [data, filters]);

  // Sorting
  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    filteredData,
    "deadline" as keyof ALAStatus,
    "desc",
  );

  // Pagination
  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useTablePagination(sortedData);

  // Export columns
  const exportColumns: ExportColumn<ALAStatus>[] = [
    { key: "title", header: "Title", accessor: (row) => row.title },
    { key: "subject", header: "Subject", accessor: (row) => row.subject },
    { key: "class", header: "Class", accessor: (row) => row.class },
    {
      key: "deadline",
      header: "Deadline",
      accessor: (row) => row.deadline,
      format: (v) => new Date(v as string).toLocaleDateString(),
    },
    { key: "graded", header: "Graded", accessor: (row) => row.graded },
    { key: "pending", header: "Pending", accessor: (row) => row.pending },
    { key: "total", header: "Total Students", accessor: (row) => row.total },
  ];

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent ALAs</CardTitle>
          <CardDescription>
            Latest ALA status and grading progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IllustratedEmpty
            preset="noAlas"
            title="No ALAs found"
            description="ALAs will appear here once professors create them."
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent ALAs</CardTitle>
          <CardDescription>
            Latest ALA status and grading progress
          </CardDescription>
        </div>
        <DataExportButton
          data={filteredData}
          columns={exportColumns}
          filename="ala-status"
          formats={["csv", "excel"]}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        {filteredData.length === 0 ? (
          <IllustratedEmpty
            preset="noResults"
            title="No ALAs match your filters"
            description="Try adjusting your search or filter criteria."
            size="sm"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SimpleSortableHeader<ALAStatus>
                    label="ALA"
                    sortKey="title"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SimpleSortableHeader<ALAStatus>
                    label="Subject"
                    sortKey="subject"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SimpleSortableHeader<ALAStatus>
                    label="Class"
                    sortKey="class"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SimpleSortableHeader<ALAStatus>
                    label="Deadline"
                    sortKey="deadline"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <TableHead>Status</TableHead>
                  <SimpleSortableHeader<ALAStatus>
                    label="Progress"
                    sortKey="graded"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="text-right"
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((ala) => (
                  <TableRow
                    key={ala._id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {ala.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ala.subject}</Badge>
                    </TableCell>
                    <TableCell>{ala.class}</TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {formatDeadline(ala.deadline)}
                    </TableCell>
                    <TableCell>
                      {ala.isLocked ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      ) : ala.isPast ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Overdue
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-green-600 tabular-nums">
                          {ala.graded}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="tabular-nums">{ala.total}</span>
                        {ala.pending > 0 && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-orange-600"
                          >
                            {ala.pending} pending
                          </Badge>
                        )}
                        {ala.graded === ala.total && ala.total > 0 && (
                          <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              pageIndex={currentPage}
              pageSize={pageSize}
              pageCount={totalPages}
              totalItems={filteredData.length}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
