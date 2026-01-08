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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import {
  useSimpleSort,
  useTablePagination,
  SimpleSortableHeader,
  PaginationControls,
} from "@/components/ui/enhanced-data-table";
import {
  MoreHorizontal,
  Pencil,
  UserMinus,
  User,
  GraduationCap,
  Calendar,
  BookOpen,
  Building2,
  Mail,
  AlertTriangle,
} from "lucide-react";
import {
  removeStudentFromClass,
  bulkRemoveStudentsFromClass,
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
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeName, setRemoveName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
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

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    filteredStudents,
    "firstName" as keyof Student,
  );

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useTablePagination(sortedData);

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
    [clearSelection, router],
  );

  const handleRemoveClick = (studentId: string, studentName: string) => {
    setRemoveId(studentId);
    setRemoveName(studentName);
  };

  const handleRemove = async () => {
    if (!removeId) return;
    setIsLoading(true);

    const result = await removeStudentFromClass(removeId);

    if (result.success) {
      toast.success("Student removed from class");
      setRemoveId(null);
      setRemoveName("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove student");
    }

    setIsLoading(false);
  };

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <GraduationCap className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No students found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create students first to assign them to classes.
        </p>
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No students match your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[50px]">
                      <SelectAllCheckbox
                        checked={
                          isAllSelected
                            ? true
                            : isIndeterminate
                              ? "indeterminate"
                              : false
                        }
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
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((student) => (
                    <TableRow
                      key={student._id}
                      data-state={
                        isSelected(student._id) ? "selected" : undefined
                      }
                      className="group"
                    >
                      <TableCell>
                        <SelectRowCheckbox
                          checked={isSelected(student._id)}
                          onCheckedChange={(checked) =>
                            toggleRow(student._id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.classId ? (
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {student.classId.name} (
                              {student.classId.academicYear})
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.classId?.semesterId?.name ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {student.classId.semesterId.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.classId?.semesterId?.courseId ? (
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            <Badge variant="outline" className="font-mono">
                              {student.classId.semesterId.courseId.code}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.classId?.semesterId?.courseId?.departmentId
                          ?.code ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {
                              student.classId.semesterId.courseId.departmentId
                                .code
                            }
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.classId ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          >
                            <span className="inline-block mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Assigned
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                          >
                            <span className="inline-block mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
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
                                className="text-destructive focus:text-destructive"
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
            </div>
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

      <AlertDialog
        open={!!removeId}
        onOpenChange={() => {
          setRemoveId(null);
          setRemoveName("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>Remove from Class</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove {removeName} from their class?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
