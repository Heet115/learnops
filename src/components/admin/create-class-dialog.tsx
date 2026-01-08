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
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Users2,
  Calendar,
  CalendarRange,
  Loader2,
} from "lucide-react";
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Create Class</DialogTitle>
                <DialogDescription>
                  Add a new class/section to a semester
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
                Class Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Section A, CSE-A"
                required
                disabled={loading}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier for this class section
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semesterId" className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Semester
              </Label>
              <Select name="semesterId" required disabled={loading}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester._id} value={semester._id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {semester.courseId.departmentId.code}
                        </span>
                        <span>
                          {semester.courseId.code} - {semester.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear" className="flex items-center gap-2">
                <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
                Academic Year
              </Label>
              <Select name="academicYear" required disabled={loading}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-500/10 text-xs font-medium text-violet-600">
                          {year.split("-")[0].slice(-2)}
                        </span>
                        <span>{year}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Class
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
