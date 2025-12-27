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
import { Progress } from "@/components/ui/progress";

interface ClassSubmission {
  name: string;
  course: string;
  semester: string;
  students: number;
  submitted: number;
  graded: number;
  pending: number;
}

interface ClassSubmissionsTableProps {
  data: ClassSubmission[];
}

export function ClassSubmissionsTable({ data }: ClassSubmissionsTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submissions by Class</CardTitle>
          <CardDescription>
            Track submission progress across classes
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground text-sm">
            No class data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions by Class</CardTitle>
        <CardDescription>
          Track submission progress across classes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Course</TableHead>
              <TableHead className="text-center">Students</TableHead>
              <TableHead className="text-center">Submitted</TableHead>
              <TableHead className="text-center">Graded</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((cls, index) => {
              const progressPercent =
                cls.submitted > 0
                  ? Math.round((cls.graded / cls.submitted) * 100)
                  : 0;
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cls.course}</Badge>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {cls.semester}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{cls.students}</TableCell>
                  <TableCell className="text-center">{cls.submitted}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-600">{cls.graded}</span>
                    {cls.pending > 0 && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({cls.pending} pending)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progressPercent} className="h-2 w-20" />
                      <span className="text-muted-foreground w-10 text-xs">
                        {progressPercent}%
                      </span>
                    </div>
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
