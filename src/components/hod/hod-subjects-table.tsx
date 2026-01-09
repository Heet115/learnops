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
import { Hash, Layers, Award, Calendar, BookMarked } from "lucide-react";

interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
  offeringCount: number;
  semesterId?: {
    name: string;
    number: number;
    courseId?: { name: string; code: string };
  };
}

interface HodSubjectsTableProps {
  subjects: Subject[];
}

export function HodSubjectsTable({ subjects }: HodSubjectsTableProps) {
  const {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  } = usePersistedFilters({
    storageKey: "hod-subjects-filters",
    defaultFilters: { search: "", course: "" },
  });

  const courseOptions = useMemo(() => {
    const courses = new Map<string, { label: string; value: string }>();
    subjects.forEach((sub) => {
      const course = sub.semesterId?.courseId;
      if (course) {
        courses.set(course.code, {
          label: `${course.code} - ${course.name}`,
          value: course.code,
        });
      }
    });
    return Array.from(courses.values());
  }, [subjects]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name or code...",
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

  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const course = filters.course as string;

      if (search) {
        if (
          !sub.name.toLowerCase().includes(search) &&
          !sub.code.toLowerCase().includes(search)
        )
          return false;
      }
      if (
        course &&
        course !== "all" &&
        sub.semesterId?.courseId?.code !== course
      )
        return false;

      return true;
    });
  }, [subjects, filters]);

  const subjectsWithSortFields = useMemo(() => {
    return filteredSubjects.map((sub) => ({
      ...sub,
      courseCode: sub.semesterId?.courseId?.code || "",
      semesterName: sub.semesterId?.name || "",
    }));
  }, [filteredSubjects]);

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    subjectsWithSortFields,
    "code" as keyof (typeof subjectsWithSortFields)[0],
  );

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useTablePagination(sortedData);

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <BookMarked className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No subjects found</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          No subjects are available in your department yet.
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

      {filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <BookMarked className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            No subjects match your filters.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <SimpleSortableHeader
                  label="Code"
                  sortKey="code"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SimpleSortableHeader
                  label="Subject Name"
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
                  label="Credits"
                  sortKey="credits"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-center"
                />
                <SimpleSortableHeader
                  label="Offerings"
                  sortKey="offeringCount"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-center"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((sub) => (
                <TableRow key={sub._id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <Hash className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <Badge
                        variant="outline"
                        className="border-blue-500/30 bg-blue-500/10 font-mono text-blue-600"
                      >
                        {sub.code}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="leading-none font-medium">{sub.name}</p>
                      <p className="text-muted-foreground text-xs">Subject</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-violet-500/30 bg-violet-500/10 text-violet-600"
                    >
                      <Layers className="mr-1.5 h-3 w-3" />
                      {sub.semesterId?.courseId?.code || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <Calendar className="h-3.5 w-3.5" />
                      {sub.semesterId?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                    >
                      <Award className="mr-1.5 h-3 w-3" />
                      {sub.credits}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {sub.offeringCount > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      >
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {sub.offeringCount}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-muted-foreground/30 text-muted-foreground"
                      >
                        0
                      </Badge>
                    )}
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
