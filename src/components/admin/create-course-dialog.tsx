"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCourse } from "@/lib/actions/academic.actions";
import { Loader2, Plus } from "lucide-react";
import { IDepartment } from "@/lib/db";
import { toast } from "sonner";

interface CreateCourseDialogProps {
  departments: IDepartment[];
}

const courseTypes = [
  { value: "diploma", label: "Diploma", defaultDuration: 3 },
  { value: "ug", label: "Undergraduate (UG)", defaultDuration: 4 },
  { value: "pg", label: "Postgraduate (PG)", defaultDuration: 2 },
] as const;

export function CreateCourseDialog({ departments }: CreateCourseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    departmentId: "",
    courseType: "" as "diploma" | "ug" | "pg" | "",
    duration: 4,
    semestersPerYear: 2,
  });

  const totalSemesters = formData.duration * formData.semestersPerYear;

  const handleCourseTypeChange = (value: "diploma" | "ug" | "pg") => {
    const courseType = courseTypes.find((ct) => ct.value === value);
    setFormData({
      ...formData,
      courseType: value,
      duration: courseType?.defaultDuration || formData.duration,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.departmentId) {
      setError("Please select a department");
      setIsLoading(false);
      return;
    }

    if (!formData.courseType) {
      setError("Please select a course type");
      setIsLoading(false);
      return;
    }

    const result = await createCourse({
      name: formData.name,
      code: formData.code,
      departmentId: formData.departmentId,
      courseType: formData.courseType,
      duration: formData.duration,
      semestersPerYear: formData.semestersPerYear,
    });

    if (result.success) {
      toast.success(`Course created with ${result.semestersCreated} semesters`);
      setOpen(false);
      setFormData({
        name: "",
        code: "",
        departmentId: "",
        courseType: "",
        duration: 4,
        semestersPerYear: 2,
      });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create course");
      setError(result.error || "Failed to create course");
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
          <DialogDescription>
            Add a new academic course. Semesters will be auto-generated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Course Name</Label>
              <Input
                id="name"
                placeholder="e.g., B.Tech Computer Science"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                placeholder="e.g., BTCS"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                required
                disabled={isLoading}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, departmentId: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem
                      key={(
                        dept._id as unknown as { toString(): string }
                      ).toString()}
                      value={(
                        dept._id as unknown as { toString(): string }
                      ).toString()}
                    >
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseType">Course Type</Label>
              <Select
                value={formData.courseType}
                onValueChange={handleCourseTypeChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course type" />
                </SelectTrigger>
                <SelectContent>
                  {courseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Years)</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration: parseInt(value) })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year} {year === 1 ? "Year" : "Years"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semestersPerYear">Semesters/Year</Label>
                <Select
                  value={formData.semestersPerYear.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      semestersPerYear: parseInt(value),
                    })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.courseType && (
              <div className="bg-muted rounded-md p-3 text-sm">
                <span className="font-medium">Total Semesters:</span>{" "}
                {totalSemesters} (will be auto-created)
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
