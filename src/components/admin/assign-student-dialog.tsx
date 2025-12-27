"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { assignStudentToClass } from "@/lib/actions/user.actions";
import { toast } from "sonner";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  classId?: unknown;
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

interface AssignStudentDialogProps {
  students: Student[];
  classes: ClassItem[];
}

export function AssignStudentDialog({
  students,
  classes,
}: AssignStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const unassignedStudents = students.filter((s) => !s.classId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const studentId = formData.get("studentId") as string;
    const classId = formData.get("classId") as string;

    const result = await assignStudentToClass(studentId, classId);

    if (result.success) {
      toast.success("Student assigned to class successfully");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to assign student");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Student to Class</DialogTitle>
            <DialogDescription>
              Select an unassigned student and assign them to a class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student</Label>
              <Select name="studentId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedStudents.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No unassigned students
                    </SelectItem>
                  ) : (
                    unassignedStudents.map((student) => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.firstName} {student.lastName} ({student.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="classId">Class</Label>
              <Select name="classId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {classItem.semesterId?.courseId?.departmentId?.code} -{" "}
                      {classItem.semesterId?.courseId?.code} -{" "}
                      {classItem.semesterId?.name} - {classItem.name} (
                      {classItem.academicYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || unassignedStudents.length === 0}
            >
              {loading ? "Assigning..." : "Assign Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
