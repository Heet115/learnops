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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Users,
  Mail,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  subjects: number;
  alas: number;
  pending: number;
  graded: number;
}

interface HodProfessorsTableProps {
  professors: Professor[];
}

export function HodProfessorsTable({ professors }: HodProfessorsTableProps) {
  const {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  } = usePersistedFilters({
    storageKey: "hod-professors-filters",
    defaultFilters: { search: "" },
  });

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name or email...",
      },
    ],
    [],
  );

  const filteredProfessors = useMemo(() => {
    return professors.filter((prof) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      if (search) {
        const fullName = `${prof.firstName} ${prof.lastName}`.toLowerCase();
        if (
          !fullName.includes(search) &&
          !prof.email.toLowerCase().includes(search)
        )
          return false;
      }
      return true;
    });
  }, [professors, filters]);

  const professorsWithSortFields = useMemo(() => {
    return filteredProfessors.map((prof) => ({
      ...prof,
      fullName: `${prof.firstName} ${prof.lastName}`,
    }));
  }, [filteredProfessors]);

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    professorsWithSortFields,
    "fullName" as keyof (typeof professorsWithSortFields)[0],
  );

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useTablePagination(sortedData);

  if (professors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <Users className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No professors found</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          No professors are assigned to your department yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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

      {filteredProfessors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Users className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            No professors match your filters.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <SimpleSortableHeader
                    label="Professor"
                    sortKey="fullName"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[180px]"
                  />
                  <SimpleSortableHeader
                    label="Email"
                    sortKey="email"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[180px]"
                  />
                  <SimpleSortableHeader
                    label="Subjects"
                    sortKey="subjects"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[90px] text-center"
                  />
                  <SimpleSortableHeader
                    label="ALAs"
                    sortKey="alas"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[80px] text-center"
                  />
                  <SimpleSortableHeader
                    label="Pending"
                    sortKey="pending"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[90px] text-center"
                  />
                  <SimpleSortableHeader
                    label="Graded"
                    sortKey="graded"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[90px] text-center"
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((prof) => (
                  <TableRow key={prof._id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={prof.profileImage} />
                          <AvatarFallback className="bg-blue-500/10 text-sm font-medium text-blue-600">
                            {prof.firstName[0]}
                            {prof.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="leading-none font-medium">
                            {prof.firstName} {prof.lastName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Professor
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="text-sm">{prof.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="border-violet-500/30 bg-violet-500/10 text-violet-600"
                      >
                        <BookOpen className="mr-1.5 h-3 w-3" />
                        {prof.subjects}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                      >
                        <FileText className="mr-1.5 h-3 w-3" />
                        {prof.alas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {prof.pending > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                        >
                          <Clock className="mr-1.5 h-3 w-3" />
                          {prof.pending}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      >
                        <CheckCircle2 className="mr-1.5 h-3 w-3" />
                        {prof.graded}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
