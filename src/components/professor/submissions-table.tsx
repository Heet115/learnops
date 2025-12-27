"use client";

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
      <CardContent className="p-0">
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
            {submissions.map((sub) => {
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
                            {sub.studentId?.firstName} {sub.studentId?.lastName}
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
                      ? new Date(sub.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(sub.status, sub.marks, sub.alaId?.maxMarks)}
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
      </CardContent>
    </Card>
  );
}
