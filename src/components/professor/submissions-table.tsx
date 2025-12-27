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
import { Eye, Clock, CheckCircle, XCircle } from "lucide-react";

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
}

interface SubmissionsTableProps {
  submissions: Submission[];
}

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const getStatusBadge = (status: string, marks?: number, maxMarks?: number) => {
    switch (status) {
      case "graded":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {marks}/{maxMarks}
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
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
        <CardContent className="py-8 text-center text-muted-foreground">
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
            {submissions.map((sub) => (
              <TableRow key={sub._id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {sub.studentId?.firstName} {sub.studentId?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{sub.studentId?.email}</p>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
