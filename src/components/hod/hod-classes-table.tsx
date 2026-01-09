"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DataTableFilter,
  FilterConfig,
} from "@/components/ui/data-table-filter";
import { SaveFiltersButton } from "@/components/ui/save-filters-button";
import { usePersistedFilters } from "@/hooks/use-persisted-filters";
import {
  useSimpleSort,
  useTablePagination,
  SimpleSortableHeader,
  PaginationControls,
} from "@/components/ui/enhanced-data-table";
import { GraduationCap, Users, BookOpen, Calendar, Layers } from "lucide-react";

interface ClassItem {
  _id: string;
  name: string;
  academicYear: string;
  studentCount: number;
  subjectCount: number;
  semesterId?: {
    name: string;
    number: number;
    courseId?: { name: string; code: string };
  };
}

interface HodClassesTableProps {
  classes: ClassItem[];
}

export function HodClassesTable({ classes }: HodClassesTableProps) {
  const {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  } = usePersistedFilters({
    storageKey: "hod-classes-filters",
    defaultFilters: { search: "", course: "", academicYear: "" },
  });

  const { courseOptions, yearOptions } = useMemo(() => {
    const courses = new Map<string, { label: string; value: string }>();
    const years = new Set<string>();
    classes.forEach((cls) => {
      const course = cls.semesterId?.courseId;
      if (course) {
        courses.set(course.code, {
          label: `${course.code} - ${course.name}`,
          value: course.code,
        });
      }
      if (cls.academicYear) years.add(cls.academicYear);
    });
    return {
      courseOptions: Array.from(courses.values()),
      yearOptions: Array.from(years)
        .sort()
        .reverse()
        .map((y) => ({ label: y, value: y })),
    };
  }, [classes]);

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
      {
        key: "academicYear",
        label: "Academic Year",
        type: "select",
        options: yearOptions,
      },
    ],
    [courseOptions, yearOptions],
  );

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const course = filters.course as string;
      const academicYear = filters.academicYear as string;

      if (search && !cls.name.toLowerCase().includes(search)) return false;
      if (
        course &&
        course !== "all" &&
        cls.semesterId?.courseId?.code !== course
      )
        return false;
      if (
        academicYear &&
        academicYear !== "all" &&
        cls.academicYear !== academicYear
      )
        return false;

      return true;
    });
  }, [classes, filters]);

  const classesWithSortFields = useMemo(() => {
    return filteredClasses.map((cls) => ({
      ...cls,
      courseCode: cls.semesterId?.courseId?.code || "",
      semesterName: cls.semesterId?.name || "",
    }));
  }, [filteredClasses]);

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    classesWithSortFields,
    "academicYear" as keyof (typeof classesWithSortFields)[0],
    "desc",
  );

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useTablePagination(sortedData);

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <GraduationCap className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No classes found</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          No classes are available in your department yet.
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

      {filteredClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <GraduationCap className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            No classes match your filters.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <SimpleSortableHeader
                  label="Class Name"
                  sortKey="name"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader
                  label="Course"
                  sortKey="courseCode"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader
                  label="Semester"
                  sortKey="semesterName"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader
                  label="Academic Year"
                  sortKey="academicYear"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader
                  label="Students"
                  sortKey="studentCount"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-center"
                />
                <SimpleSortableHeader
                  label="Subjects"
                  sortKey="subjectCount"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-center"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((cls) => (
                <TableRow key={cls._id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="leading-none font-medium">{cls.name}</p>
                        <p className="text-muted-foreground text-xs">Section</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-violet-500/30 bg-violet-500/10 text-violet-600"
                    >
                      <Layers className="mr-1.5 h-3 w-3" />
                      {cls.semesterId?.courseId?.code || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {cls.semesterId?.name || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                    >
                      <Calendar className="mr-1.5 h-3 w-3" />
                      {cls.academicYear}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                    >
                      <Users className="mr-1.5 h-3 w-3" />
                      {cls.studentCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    >
                      <BookOpen className="mr-1.5 h-3 w-3" />
                      {cls.subjectCount}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
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
