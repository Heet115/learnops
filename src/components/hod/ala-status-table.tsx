"use client";

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
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent ALAs</CardTitle>
          <CardDescription>
            Latest ALA status and grading progress
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground text-sm">No ALAs found</p>
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
      <CardHeader>
        <CardTitle>Recent ALAs</CardTitle>
        <CardDescription>
          Latest ALA status and grading progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ALA</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((ala) => (
              <TableRow key={ala._id}>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {ala.title}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ala.subject}</Badge>
                </TableCell>
                <TableCell>{ala.class}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
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
                    <span className="text-green-600">{ala.graded}</span>
                    <span className="text-muted-foreground">/</span>
                    <span>{ala.total}</span>
                    {ala.pending > 0 && (
                      <Badge variant="outline" className="ml-2 text-orange-600">
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
      </CardContent>
    </Card>
  );
}
