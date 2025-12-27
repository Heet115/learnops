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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createClass } from "@/lib/actions/academic.actions";
import { toast } from "sonner";

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

interface CreateClassDialogProps {
  semesters: Semester[];
}

// Generate academic year options (current year and next 2 years)
function getAcademicYearOptions() {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let i = -1; i <= 2; i++) {
    const startYear = currentYear + i;
    options.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`);
  }
  return options;
}

export function CreateClassDialog({ semesters }: CreateClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    };

    const result = await createClass(data);

    if (result.success) {
      toast.success("Class created successfully");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create class");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Class</DialogTitle>
            <DialogDescription>
              Add a new class/section to a semester
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Section A, CSE-A"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semesterId">Semester</Label>
              <Select name="semesterId" required>
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
              <Select name="academicYear" required>
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
