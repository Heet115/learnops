"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
import {
  BulkActionsBar,
  SelectAllCheckbox,
  SelectRowCheckbox,
  useRowSelection,
} from "@/components/ui/bulk-actions";
import { useSimpleSort, useTablePagination, SimpleSortableHeader, PaginationControls } from "@/components/ui/enhanced-data-table";
import { MoreHorizontal, Pencil, UserMinus, Users } from "lucide-react";
import {
  removeStudentFromClass,
  bulkRemoveStudentsFromClass,
  bulkAssignStudentsToClass,
} from "@/lib/actions/user.actions";
import { toast } from "sonner";
import { ChangeClassDialog } from "./change-class-dialog";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  classId?: {
    _id: string;
    name: string;
    academicYear: string;
    semesterId?: {
      _id: string;
      name: string;
      number: number;
      courseId?: {
        name: string;
        code: string;
        departmentId?: {
          name: string;
          code: string;
        };
      };
    };
  };
}

interface ClassItem {
  _id: string;
  name: string;
  academicYear: string;
  semesterId: {
    _id: string;
    name: string;
    courseId: {
      name: string;
      code: string;
      departmentId: {
        code: string;
      };
    };
  };
}

interface StudentAssignmentsTableProps {
  students: Student[];
  classes: ClassItem[];
}

export function StudentAssignmentsTable({
  students,
  classes,
}: StudentAssignmentsTableProps) {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({
    open: false,
    id: "",
    name: "",
  });
  const router = useRouter();
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    class: "",
    department: "",
    assignmentStatus: "",
  });

  const { classOptions, departmentOptions } = useMemo(() => {
    const classOpts = classes.map((c) => ({
      label: `${c.name} (${c.academicYear})`,
      value: c._id,
    }));
    const deptMap = new Map<string, { label: string; value: string }>();
    students.forEach((s) => {
      const dept = s.classId?.semesterId?.courseId?.departmentId;
      if (dept) {
        deptMap.set(dept.code, {
          label: `${dept.code} - ${dept.name}`,
          value: dept.code,
        });
      }
    });
    return {
      classOptions: classOpts,
      departmentOptions: Array.from(deptMap.values()),
    };
  }, [classes, students]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name or email...",
      },
      { key: "class", label: "Class", type: "select", options: classOptions },
      {
        key: "department",
        label: "Department",
        type: "select",
        options: departmentOptions,
      },
      {
        key: "assignmentStatus",
        label: "Assignment",
        type: "select",
        options: [
          { label: "Assigned", value: "assigned" },
          { label: "Unassigned", value: "unassigned" },
        ],
      },
    ],
    [classOptions, departmentOptions],
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const classFilter = filters.class as string;
      const department = filters.department as string;
      const assignmentStatus = filters.assignmentStatus as string;

      if (search) {
        const fullName =
          `${student.firstName} ${student.lastName}`.toLowerCase();
        if (
          !fullName.includes(search) &&
          !student.email.toLowerCase().includes(search)
        )
          return false;
      }

      if (
        classFilter &&
        classFilter !== "all" &&
        student.classId?._id !== classFilter
      )
        return false;
      if (
        department &&
        department !== "all" &&
        student.classId?.semesterId?.courseId?.departmentId?.code !== department
      )
        return false;

      if (assignmentStatus && assignmentStatus !== "all") {
        if (assignmentStatus === "assigned" && !student.classId) return false;
        if (assignmentStatus === "unassigned" && student.classId) return false;
      }

      return true;
    });
  }, [students, filters]);

  // Sorting
  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(filteredStudents, "firstName" as keyof Student);

  const { paginatedData, currentPage, pageSize, totalPages, setCurrentPage, setPageSize } = useTablePagination(sortedData);

  const {
    selectedItems,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    toggleAll,
    toggleRow,
    clearSelection,
    isSelected,
  } = useRowSelection(filteredStudents);

  const bulkActions = useMemo(
    () => [
      {
        label: "Remove from Class",
        icon: <UserMinus className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: Student[]) => {
          const assignedStudents = items.filter((s) => s.classId);
          if (assignedStudents.length === 0) {
            toast.error("No assigned students selected");
            return;
          }
          const ids = assignedStudents.map((s) => s._id);
          const result = await bulkRemoveStudentsFromClass(ids);
          if (result.success) {
            toast.success(`${result.count} students removed from class`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to remove students");
          }
        },
      },
    ],
    [clearSelection, router]
  );

  const handleRemoveClick = (studentId: string, studentName: string) => {
    setRemoveConfirm({ open: true, id: studentId, name: studentName });
  };

  const handleRemoveConfirm = async () => {
    const { id } = removeConfirm;
    setRemoveConfirm({ open: false, id: "", name: "" });

    const result = await removeStudentFromClass(id);
    if (result.success) {
      toast.success("Student removed from class");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove student");
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No students found. Create students first to assign them to classes.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        <BulkActionsBar
          selectedCount={selectedCount}
          totalCount={filteredStudents.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredStudents.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No students match your filters.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <SelectAllCheckbox
                      checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <SimpleSortableHeader<Student>
                    label="Student"
                    sortKey="firstName"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SimpleSortableHeader<Student>
                    label="Email"
                    sortKey="email"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <TableHead>Class</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((student) => (
                  <TableRow
                    key={student._id}
                    data-state={isSelected(student._id) ? "selected" : undefined}
                  >
                    <TableCell>
                      <SelectRowCheckbox
                        checked={isSelected(student._id)}
                        onCheckedChange={(checked) => toggleRow(student._id, checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      {student.classId ? (
                        <span>
                          {student.classId.name} ({student.classId.academicYear})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.classId?.semesterId?.name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.classId?.semesterId?.courseId ? (
                        <span>{student.classId.semesterId.courseId.code}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.classId?.semesterId?.courseId?.departmentId
                        ?.code || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.classId ? (
                        <Badge variant="default">Assigned</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-orange-300 text-orange-600"
                        >
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingStudent(student)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {student.classId ? "Change Class" : "Assign Class"}
                          </DropdownMenuItem>
                          {student.classId && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                handleRemoveClick(
                                  student._id,
                                  `${student.firstName} ${student.lastName}`,
                                )
                              }
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remove from Class
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              pageIndex={currentPage}
              pageSize={pageSize}
              pageCount={totalPages}
              totalItems={filteredStudents.length}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {editingStudent && (
        <ChangeClassDialog
          student={editingStudent}
          classes={classes}
          open={!!editingStudent}
          onOpenChange={(open) => !open && setEditingStudent(null)}
        />
      )}

      <ConfirmDialog
        open={removeConfirm.open}
        onOpenChange={(open) =>
          !open && setRemoveConfirm({ open: false, id: "", name: "" })
        }
        title="Remove from Class"
        description={`Remove ${removeConfirm.name} from their class?`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleRemoveConfirm}
      />
    </>
  );
}
