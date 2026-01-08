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
import { GraduationCap, Users, Layers } from "lucide-react";

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

  // Sorting
  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    filteredData,
    "name" as keyof ClassSubmission,
    "asc",
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
  const exportColumns: ExportColumn<ClassSubmission>[] = [
    { key: "name", header: "Class Name", accessor: (row) => row.name },
    { key: "course", header: "Course", accessor: (row) => row.course },
    { key: "semester", header: "Semester", accessor: (row) => row.semester },
    {
      key: "students",
      header: "Total Students",
      accessor: (row) => row.students,
    },
    { key: "submitted", header: "Submitted", accessor: (row) => row.submitted },
    { key: "graded", header: "Graded", accessor: (row) => row.graded },
    { key: "pending", header: "Pending", accessor: (row) => row.pending },
  ];

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <GraduationCap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle>Submissions by Class</CardTitle>
              <CardDescription>
                Track submission progress across classes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <IllustratedEmpty
            preset="noClasses"
            title="No class data available"
            description="Class submission data will appear here."
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle>Submissions by Class</CardTitle>
            <CardDescription>
              Track submission progress across classes
            </CardDescription>
          </div>
        </div>
        <DataExportButton
          data={filteredData}
          columns={exportColumns}
          filename="class-submissions"
          formats={["csv", "excel"]}
        />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        {filteredData.length === 0 ? (
          <IllustratedEmpty
            preset="noResults"
            title="No classes match your filters"
            description="Try adjusting your search or filter criteria."
            size="sm"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <SimpleSortableHeader<ClassSubmission>
                    label="Class"
                    sortKey="name"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SimpleSortableHeader<ClassSubmission>
                    label="Course"
                    sortKey="course"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SimpleSortableHeader<ClassSubmission>
                    label="Students"
                    sortKey="students"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="text-center"
                  />
                  <SimpleSortableHeader<ClassSubmission>
                    label="Submitted"
                    sortKey="submitted"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="text-center"
                  />
                  <SimpleSortableHeader<ClassSubmission>
                    label="Graded"
                    sortKey="graded"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="text-center"
                  />
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((cls, index) => {
                  const progressPercent =
                    cls.submitted > 0
                      ? Math.round((cls.graded / cls.submitted) * 100)
                      : 0;
                  return (
                    <TableRow
                      key={index}
                      className="group hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{cls.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-violet-500/30 bg-violet-500/10 text-violet-600"
                        >
                          <Layers className="mr-1.5 h-3 w-3" />
                          {cls.course}
                        </Badge>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {cls.semester}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                        >
                          <Users className="mr-1.5 h-3 w-3" />
                          {cls.students}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {cls.submitted}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        >
                          {cls.graded}
                        </Badge>
                        {cls.pending > 0 && (
                          <Badge
                            variant="outline"
                            className="ml-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600"
                          >
                            {cls.pending} pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={progressPercent}
                            className="h-2 w-20"
                          />
                          <span className="text-muted-foreground w-10 text-xs tabular-nums">
                            {progressPercent}%
                          </span>
                        </div>
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
