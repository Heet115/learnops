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
import { Progress } from "@/components/ui/progress";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";

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
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    course: "",
  });

  const courseOptions = useMemo(() => {
    const courses = new Set(data.map((d) => d.course));
    return Array.from(courses).map((c) => ({ label: c, value: c }));
  }, [data]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by class name...",
      },
      {
        key: "course",
        label: "Course",
        type: "select",
        options: courseOptions,
      },
    ],
    [courseOptions],
  );

  const filteredData = useMemo(() => {
    return data.filter((cls) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const course = filters.course as string;

      if (search && !cls.name.toLowerCase().includes(search)) return false;
      if (course && course !== "all" && cls.course !== course) return false;

      return true;
    });
  }, [data, filters]);

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
      <CardContent className="space-y-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        {filteredData.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No classes match your filters.
          </div>
        ) : (
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
              {filteredData.map((cls, index) => {
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
                    <TableCell className="text-center">
                      {cls.students}
                    </TableCell>
                    <TableCell className="text-center">
                      {cls.submitted}
                    </TableCell>
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
                        <Progress
                          value={progressPercent}
                          className="h-2 w-20"
                        />
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
        )}
      </CardContent>
    </Card>
  );
}
