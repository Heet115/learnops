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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Pencil, User, GraduationCap, Building2 } from "lucide-react";
import { assignStudentToClass } from "@/lib/actions/user.actions";
import { toast } from "sonner";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  classId?: {
    _id: string;
    name: string;
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

interface ChangeClassDialogProps {
  student: Student;
  classes: ClassItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeClassDialog({
  student,
  classes,
  open,
  onOpenChange,
}: ChangeClassDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const classId = formData.get("classId") as string;

    const result = await assignStudentToClass(student._id, classId);

    if (result.success) {
      toast.success("Student class updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update student class");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Pencil className="text-primary h-5 w-5" />
              </div>
              <div>
                <DialogTitle>
                  {student.classId ? "Change Class" : "Assign Class"}
                </DialogTitle>
                <DialogDescription>
                  {student.classId
                    ? `Change class for ${student.firstName} ${student.lastName}`
                    : `Assign ${student.firstName} ${student.lastName} to a class`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-4" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <User className="text-muted-foreground h-3.5 w-3.5" />
                Student
              </Label>
              <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                </div>
                {student.firstName} {student.lastName}
                <span className="text-muted-foreground text-xs">
                  ({student.email})
                </span>
              </div>
            </div>

            {student.classId && (
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                  Current Class
                </Label>
                <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10">
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  {student.classId.name}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="classId" className="flex items-center gap-2">
                <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                New Class
              </Label>
              <Select
                name="classId"
                defaultValue={student.classId?._id}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                        {classItem.semesterId?.courseId?.departmentId?.code} -{" "}
                        {classItem.semesterId?.courseId?.code} -{" "}
                        {classItem.semesterId?.name} - {classItem.name}
                        <span className="text-muted-foreground">
                          ({classItem.academicYear})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator className="my-4" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
