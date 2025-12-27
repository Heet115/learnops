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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateClass } from "@/lib/actions/academic.actions";
import { toast } from "sonner";

interface ClassItem {
  _id: string;
  name: string;
  academicYear: string;
  isActive: boolean;
  semesterId: {
    _id: string;
    name: string;
  };
}

interface Semester {
  _id: string;
  name: string;
  number: number;
  courseId: {
    _id: string;
    name: string;
    code: string;
    departmentId: {
      name: string;
      code: string;
    };
  };
}

interface EditClassDialogProps {
  classItem: ClassItem;
  semesters: Semester[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getAcademicYearOptions() {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let i = -2; i <= 2; i++) {
    const startYear = currentYear + i;
    options.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`);
  }
  return options;
}

export function EditClassDialog({
  classItem,
  semesters,
  open,
  onOpenChange,
}: EditClassDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(classItem.isActive);
  const router = useRouter();

  const academicYears = getAcademicYearOptions();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      semesterId: formData.get("semesterId") as string,
      academicYear: formData.get("academicYear") as string,
      isActive,
    };

    const result = await updateClass(classItem._id, data);

    if (result.success) {
      toast.success("Class updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update class");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={classItem.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semesterId">Semester</Label>
              <Select name="semesterId" defaultValue={classItem.semesterId._id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester._id} value={semester._id}>
                      {semester.courseId.departmentId.code} -{" "}
                      {semester.courseId.code} - {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select name="academicYear" defaultValue={classItem.academicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
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
