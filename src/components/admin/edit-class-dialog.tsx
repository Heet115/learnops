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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Users2,
  Calendar,
  CalendarRange,
  Loader2,
  Save,
} from "lucide-react";
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Users2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle>Edit Class</DialogTitle>
                  <Badge
                    variant="outline"
                    className={
                      classItem.isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    }
                  >
                    {classItem.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <DialogDescription>Update class details</DialogDescription>
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
                defaultValue={classItem.name}
                required
                disabled={loading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semesterId" className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Semester
              </Label>
              <Select
                name="semesterId"
                defaultValue={classItem.semesterId._id}
                disabled={loading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
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
              <Select
                name="academicYear"
                defaultValue={classItem.academicYear}
                disabled={loading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
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

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive classes won&apos;t accept new students
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={loading}
              />
            </div>
          </div>

          <Separator />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
