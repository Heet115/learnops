"use client";

import { useState } from "react";
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
import { MoreHorizontal, Pencil, UserMinus } from "lucide-react";
import { removeStudentFromClass } from "@/lib/actions/user.actions";
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
  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: "",
    name: "",
  });
  const router = useRouter();

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student._id}>
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
                {student.classId?.semesterId?.courseId?.departmentId?.code || (
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
        onOpenChange={(open) => !open && setRemoveConfirm({ open: false, id: "", name: "" })}
        title="Remove from Class"
        description={`Remove ${removeConfirm.name} from their class?`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleRemoveConfirm}
      />
    </>
  );
}
