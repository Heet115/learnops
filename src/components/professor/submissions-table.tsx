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
import { Eye, Clock, CheckCircle, XCircle, Users } from "lucide-react";

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

  const getStatusBadge = (
    status: string,
    marks?: number,
    maxMarks?: number,
  ) => {
    switch (status) {
      case "graded":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            {marks}/{maxMarks}
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-orange-100 text-orange-800">
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

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center">
          No submissions found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <DataTableFilter
            filters={filterConfigs}
            values={filters}
            onChange={setFilters}
          />

          {filteredSubmissions.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No submissions match your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>ALA</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((sub) => {
                  const isGroup =
                    sub.alaId?.isGroupSubmission &&
                    sub.groupMembers &&
                    sub.groupMembers.length > 0;
                  const allMembers = isGroup
                    ? [sub.studentId, ...(sub.groupMembers || [])]
                    : [sub.studentId];

                  return (
                    <TableRow key={sub._id}>
                      <TableCell>
                        <div>
                          {isGroup ? (
                            <>
                              <div className="mb-1 flex items-center gap-1">
                                <Users className="text-muted-foreground h-3 w-3" />
                                <span className="text-muted-foreground text-xs">
                                  Group ({allMembers.length} members)
                                </span>
                              </div>
                              <p className="text-sm font-medium">
                                {allMembers
                                  .map((m) => `${m.firstName} ${m.lastName}`)
                                  .join(", ")}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Submitted by: {sub.studentId?.firstName}{" "}
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
                      <TableCell>
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
