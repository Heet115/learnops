"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T, direction: SortDirection) => number;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

// ============================================
// SORTING HOOK
// ============================================

export function useTableSort<T>(
  data: T[],
  columns: ColumnDef<T>[],
  initialSort?: SortState
) {
  const [sortState, setSortState] = React.useState<SortState>(
    initialSort || { column: null, direction: null }
  );

  const sortedData = React.useMemo(() => {
    if (!sortState.column || !sortState.direction) return data;

    const column = columns.find((c) => c.id === sortState.column);
    if (!column) return data;

    return [...data].sort((a, b) => {
      // Custom sort function
      if (column.sortFn) {
        return column.sortFn(a, b, sortState.direction);
      }

      // Default sort by accessor
      let aVal: unknown;
      let bVal: unknown;

      if (column.accessorFn) {
        aVal = column.accessorFn(a);
        bVal = column.accessorFn(b);
      } else if (column.accessorKey) {
        aVal = a[column.accessorKey];
        bVal = b[column.accessorKey];
      } else {
        return 0;
      }

      // Handle different types
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // String comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        const result = aVal.localeCompare(bVal);
        return sortState.direction === "asc" ? result : -result;
      }

      // Number comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        const result = aVal - bVal;
        return sortState.direction === "asc" ? result : -result;
      }

      // Date comparison
      if (aVal instanceof Date && bVal instanceof Date) {
        const result = aVal.getTime() - bVal.getTime();
        return sortState.direction === "asc" ? result : -result;
      }

      return 0;
    });
  }, [data, sortState, columns]);

  const toggleSort = (columnId: string) => {
    setSortState((prev) => {
      if (prev.column !== columnId) {
        return { column: columnId, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column: columnId, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  };

  return { sortedData, sortState, toggleSort, setSortState };
}

// ============================================
// PAGINATION HOOK
// ============================================

export function useTablePagination<T>(
  data: T[],
  initialPageSize = 10
) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const pageCount = Math.ceil(data.length / pagination.pageSize);

  const paginatedData = React.useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return data.slice(start, end);
  }, [data, pagination]);

  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pagination.pageIndex < pageCount - 1;

  const goToPage = (pageIndex: number) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.max(0, Math.min(pageIndex, pageCount - 1)),
    }));
  };

  const nextPage = () => {
    if (canNextPage) {
      setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }));
    }
  };

  const previousPage = () => {
    if (canPreviousPage) {
      setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
    }
  };

  const setPageSize = (pageSize: number) => {
    setPagination({ pageIndex: 0, pageSize });
  };

  // Reset to first page when data changes
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [data.length]);

  return {
    paginatedData,
    pagination,
    pageCount,
    canPreviousPage,
    canNextPage,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
  };
}

// ============================================
// ROW SELECTION HOOK
// ============================================

export function useTableSelection<T extends { _id?: string; id?: string }>(
  data: T[]
) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const getRowId = (row: T): string => {
    return (row._id || row.id || "") as string;
  };

  const isSelected = (row: T) => selectedIds.has(getRowId(row));
  const isAllSelected = data.length > 0 && selectedIds.size === data.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  const toggleRow = (row: T) => {
    const id = getRowId(row);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(getRowId)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectedRows = data.filter((row) => selectedIds.has(getRowId(row)));

  return {
    selectedIds,
    selectedRows,
    isSelected,
    isAllSelected,
    isSomeSelected,
    toggleRow,
    toggleAll,
    clearSelection,
  };
}

// ============================================
// SORTABLE HEADER COMPONENT
// ============================================

interface SortableHeaderProps {
  column: ColumnDef<unknown>;
  sortState: SortState;
  onSort: (columnId: string) => void;
}

export function SortableHeader({
  column,
  sortState,
  onSort,
}: SortableHeaderProps) {
  const isSorted = sortState.column === column.id;
  const direction = isSorted ? sortState.direction : null;

  if (!column.sortable) {
    return <span>{column.header}</span>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(column.id)}
    >
      {column.header}
      {direction === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : direction === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}

// ============================================
// PAGINATION CONTROLS COMPONENT
// ============================================

interface PaginationControlsProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalItems: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function PaginationControls({
  pageIndex,
  pageSize,
  pageCount,
  totalItems,
  canPreviousPage,
  canNextPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: PaginationControlsProps) {
  const startItem = pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      <div className="flex items-center gap-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(0)}
            disabled={!canPreviousPage}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="flex items-center gap-1 px-2 text-sm">
            Page {pageIndex + 1} of {pageCount || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={!canNextPage}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ENHANCED DATA TABLE COMPONENT
// ============================================

interface EnhancedDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  selectable?: boolean;
  pagination?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onSelectionChange?: (selectedRows: T[]) => void;
  emptyMessage?: string;
  className?: string;
}

export function EnhancedDataTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  selectable = false,
  pagination = true,
  initialPageSize = 10,
  pageSizeOptions,
  onSelectionChange,
  emptyMessage = "No results found.",
  className,
}: EnhancedDataTableProps<T>) {
  // Sorting
  const { sortedData, sortState, toggleSort } = useTableSort(data, columns);

  // Pagination
  const {
    paginatedData,
    pagination: paginationState,
    pageCount,
    canPreviousPage,
    canNextPage,
    goToPage,
    setPageSize,
  } = useTablePagination(sortedData, initialPageSize);

  // Selection
  const {
    selectedRows,
    isSelected,
    isAllSelected,
    isSomeSelected,
    toggleRow,
    toggleAll,
  } = useTableSelection(pagination ? paginatedData : sortedData);

  // Notify parent of selection changes
  React.useEffect(() => {
    onSelectionChange?.(selectedRows);
  }, [selectedRows, onSelectionChange]);

  const displayData = pagination ? paginatedData : sortedData;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={column.headerClassName}
                >
                  <SortableHeader
                    column={column as ColumnDef<unknown>}
                    sortState={sortState}
                    onSort={toggleSort}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((row, index) => (
                <TableRow
                  key={(row._id || row.id || index) as string}
                  data-state={isSelected(row) ? "selected" : undefined}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected(row)}
                        onCheckedChange={() => toggleRow(row)}
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {column.cell
                        ? column.cell(row)
                        : column.accessorFn
                          ? column.accessorFn(row)
                          : column.accessorKey
                            ? String(row[column.accessorKey] ?? "")
                            : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && data.length > 0 && (
        <PaginationControls
          pageIndex={paginationState.pageIndex}
          pageSize={paginationState.pageSize}
          pageCount={pageCount}
          totalItems={sortedData.length}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
