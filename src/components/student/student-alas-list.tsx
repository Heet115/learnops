"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
import { useTablePagination, PaginationControls } from "@/components/ui/enhanced-data-table";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import {
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";

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

interface StudentALAsListProps {
  alas: ALA[];
}

export function StudentALAsList({ alas }: StudentALAsListProps) {
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    subject: "",
    status: "",
  });

  const getStatus = (ala: ALA) => {
    if (ala.submission?.status === "graded") {
      return {
        label: "Graded",
        variant: "default" as const,
        color: "text-green-600",
        key: "graded",
      };
    }
    if (ala.submission?.status === "submitted") {
      return {
        label: "Submitted",
        variant: "secondary" as const,
        color: "text-blue-600",
        key: "submitted",
      };
    }
    if (ala.submission?.status === "rejected") {
      return {
        label: "Rejected",
        variant: "destructive" as const,
        color: "text-red-600",
        key: "rejected",
      };
    }
    if (ala.isLocked) {
      return {
        label: "Locked",
        variant: "outline" as const,
        color: "text-gray-500",
        key: "locked",
      };
    }
    if (new Date(ala.deadline) < new Date()) {
      return {
        label: "Overdue",
        variant: "destructive" as const,
        color: "text-red-600",
        key: "overdue",
      };
    }
    return {
      label: "Pending",
      variant: "outline" as const,
      color: "text-yellow-600",
      key: "pending",
    };
  };

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
    return alas.filter((ala) => {
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
        if (status.key !== statusFilter) return false;
      }

      return true;
    });
  }, [alas, filters]);

  // Pagination
  const { paginatedData, currentPage, pageSize, totalPages, setCurrentPage, setPageSize } = useTablePagination(filteredALAs, 6);

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

    if (days < 0) return { text: formatted, urgent: true, label: "Overdue" };
    if (days === 0)
      return { text: formatted, urgent: true, label: "Due today" };
    if (days === 1)
      return { text: formatted, urgent: true, label: "Due tomorrow" };
    if (days <= 3)
      return { text: formatted, urgent: true, label: `${days} days left` };
    return { text: formatted, urgent: false, label: `${days} days left` };
  };

  if (alas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <IllustratedEmpty
            preset="noAlas"
            title="No ALAs assigned yet"
            description="Check back later or contact your professor."
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <DataTableFilter
        filters={filterConfigs}
        values={filters}
        onChange={setFilters}
      />

      {filteredALAs.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <IllustratedEmpty
              preset="noResults"
              title="No ALAs match your filters"
              description="Try adjusting your search or filter criteria."
              size="sm"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {paginatedData.map((ala) => {
          const status = getStatus(ala);
          const deadline = formatDeadline(ala.deadline);
          const canSubmit =
            !ala.isLocked &&
            new Date(ala.deadline) > new Date() &&
            ala.submission?.status !== "submitted" &&
            ala.submission?.status !== "graded";

          return (
            <Card key={ala._id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{ala.title}</CardTitle>
                    <CardDescription>
                      {ala.subjectOfferingId?.subjectId?.code} -{" "}
                      {ala.subjectOfferingId?.subjectId?.name}
                    </CardDescription>
                  </div>
                  <Badge variant={status.variant} className={status.color}>
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                  {ala.description}
                </p>

                <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span
                      className={
                        deadline.urgent ? "font-medium text-red-600" : ""
                      }
                    >
                      {deadline.text}
                    </span>
                    {deadline.urgent && (
                      <span className="font-medium text-red-600">
                        ({deadline.label})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{ala.maxMarks} marks</span>
                  </div>
                  {ala.isGroupSubmission && (
                    <Badge variant="outline" className="text-xs">
                      Group
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    {ala.submission?.status === "graded" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">
                          Score: {ala.submission.marks}/{ala.maxMarks}
                        </span>
                      </div>
                    )}
                    {ala.submission?.status === "rejected" && (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Resubmission required</span>
                      </div>
                    )}
                  </div>
                  <Button
                    asChild
                    variant={canSubmit ? "default" : "outline"}
                    size="sm"
                  >
                    <Link href={`/student/alas/${ala._id}`}>
                      {canSubmit ? "Submit" : "View"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
  );
}
