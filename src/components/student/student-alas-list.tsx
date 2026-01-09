"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataTableFilter,
  FilterConfig,
} from "@/components/ui/data-table-filter";
import { SaveFiltersButton } from "@/components/ui/save-filters-button";
import {
  useSimpleSort,
  useTablePagination,
  SimpleSortableHeader,
  PaginationControls,
} from "@/components/ui/enhanced-data-table";
import {
  FileText,
  ArrowRight,
  Users,
  Calendar,
  Award,
  BookMarked,
} from "lucide-react";
import { usePersistedFilters } from "@/hooks/use-persisted-filters";

interface ALA {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  isLocked: boolean;
  isGroupSubmission: boolean;
  subjectOfferingId: {
    subjectId: { name: string; code: string };
    classId: { name: string };
  };
  professorId: { firstName: string; lastName: string };
  submission?: {
    status: string;
    marks?: number;
    submittedAt?: string;
  };
}

interface SortableALA extends ALA {
  subjectCode: string;
  type: string;
  statusLabel: string;
}

interface StudentALAsListProps {
  alas: ALA[];
}

const statusConfig: Record<
  string,
  { label: string; className: string; dotColor: string }
> = {
  graded: {
    label: "Graded",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    dotColor: "bg-emerald-500",
  },
  submitted: {
    label: "Submitted",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
    dotColor: "bg-blue-500",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-500/30 bg-rose-500/10 text-rose-600",
    dotColor: "bg-rose-500",
  },
  locked: {
    label: "Locked",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-600",
    dotColor: "bg-slate-500",
  },
  overdue: {
    label: "Overdue",
    className: "border-rose-500/30 bg-rose-500/10 text-rose-600",
    dotColor: "bg-rose-500",
  },
  pending: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    dotColor: "bg-amber-500",
  },
};

export function StudentALAsList({ alas }: StudentALAsListProps) {
  const {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  } = usePersistedFilters({
    storageKey: "student-alas-filters",
    defaultFilters: { search: "", subject: "", status: "" },
  });

  const getStatus = (ala: ALA) => {
    if (ala.submission?.status === "graded") return "graded";
    if (ala.submission?.status === "submitted") return "submitted";
    if (ala.submission?.status === "rejected") return "rejected";
    if (ala.isLocked) return "locked";
    if (new Date(ala.deadline) < new Date()) return "overdue";
    return "pending";
  };

  // Transform ALAs to include sortable fields
  const sortableALAs: SortableALA[] = useMemo(() => {
    return alas.map((ala) => ({
      ...ala,
      subjectCode: ala.subjectOfferingId?.subjectId?.code || "",
      type: ala.isGroupSubmission ? "Group" : "Individual",
      statusLabel: statusConfig[getStatus(ala)]?.label || "Pending",
    }));
  }, [alas]);

  const subjectOptions = useMemo(() => {
    const subjects = new Map<string, { label: string; value: string }>();
    alas.forEach((ala) => {
      const subject = ala.subjectOfferingId?.subjectId;
      if (subject) {
        subjects.set(subject.code, {
          label: `${subject.code} - ${subject.name}`,
          value: subject.code,
        });
      }
    });
    return Array.from(subjects.values());
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
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Pending", value: "pending" },
          { label: "Submitted", value: "submitted" },
          { label: "Graded", value: "graded" },
          { label: "Rejected", value: "rejected" },
          { label: "Overdue", value: "overdue" },
        ],
      },
    ],
    [subjectOptions],
  );

  const filteredALAs = useMemo(() => {
    return sortableALAs.filter((ala) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const subject = filters.subject as string;
      const statusFilter = filters.status as string;

      if (search && !ala.title.toLowerCase().includes(search)) return false;
      if (
        subject &&
        subject !== "all" &&
        ala.subjectOfferingId?.subjectId?.code !== subject
      )
        return false;

      if (statusFilter && statusFilter !== "all") {
        const status = getStatus(ala);
        if (status !== statusFilter) return false;
      }

      return true;
    });
  }, [sortableALAs, filters]);

  // Sorting
  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    filteredALAs,
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
  } = useTablePagination(sortedData, 10);

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    if (days < 0) return { text: formatted, urgent: true };
    if (days <= 3) return { text: formatted, urgent: true };
    return { text: formatted, urgent: false };
  };

  if (alas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <FileText className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No ALAs assigned yet</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Check back later or contact your professor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
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
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <SimpleSortableHeader<SortableALA>
                  label="Title"
                  sortKey="title"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader<SortableALA>
                  label="Subject"
                  sortKey="subjectCode"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader<SortableALA>
                  label="Deadline"
                  sortKey="deadline"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader<SortableALA>
                  label="Marks"
                  sortKey="maxMarks"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader<SortableALA>
                  label="Type"
                  sortKey="type"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader<SortableALA>
                  label="Status"
                  sortKey="statusLabel"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((ala) => {
                const status = getStatus(ala);
                const config = statusConfig[status];
                const deadline = formatDeadline(ala.deadline);
                const canSubmit =
                  !ala.isLocked &&
                  new Date(ala.deadline) > new Date() &&
                  ala.submission?.status !== "submitted" &&
                  ala.submission?.status !== "graded";

                return (
                  <TableRow key={ala._id} className="group">
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
                      <div
                        className={`flex items-center gap-1.5 text-sm tabular-nums ${deadline.urgent ? "font-medium text-rose-600" : "text-muted-foreground"}`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {deadline.text}
                      </div>
                    </TableCell>
                    <TableCell>
                      {status === "graded" ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        >
                          <Award className="mr-1.5 h-3 w-3" />
                          {ala.submission?.marks}/{ala.maxMarks}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                        >
                          <Award className="mr-1.5 h-3 w-3" />
                          {ala.maxMarks}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {ala.isGroupSubmission ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600"
                        >
                          <Users className="h-3 w-3" />
                          Group
                        </Badge>
                      ) : (
                        <Badge variant="outline">Individual</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config.className}>
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${config.dotColor}`}
                        />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        asChild
                        variant={canSubmit ? "default" : "outline"}
                        size="sm"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Link href={`/student/alas/${ala._id}`}>
                          {canSubmit ? "Submit" : "View"}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
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
            totalItems={sortedData.length}
            canPreviousPage={currentPage > 0}
            canNextPage={currentPage < totalPages - 1}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
