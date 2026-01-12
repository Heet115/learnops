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
import { Separator } from "@/components/ui/separator";
import { createCourse } from "@/lib/actions/academic.actions";
import {
  Loader2,
  Plus,
  BookOpen,
  Code2,
  Building2,
  GraduationCap,
  Clock,
  Layers,
  Info,
} from "lucide-react";
import { IDepartment } from "@/lib/db";
import { toast } from "sonner";

interface CreateCourseDialogProps {
  departments: IDepartment[];
}

const courseTypes = [
  {
    value: "diploma",
    label: "Diploma",
    defaultDuration: 3,
    description: "3-year diploma program",
    color: "amber",
  },
  {
    value: "ug",
    label: "Undergraduate (UG)",
    defaultDuration: 4,
    description: "4-year bachelor's degree",
    color: "blue",
  },
  {
    value: "pg",
    label: "Postgraduate (PG)",
    defaultDuration: 2,
    description: "2-year master's degree",
    color: "violet",
  },
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

  const colorMap: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    violet: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <BookOpen className="text-primary h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create Course</DialogTitle>
              <DialogDescription>
                Add a new academic course. Semesters will be auto-generated.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <BookOpen className="text-muted-foreground h-3.5 w-3.5" />
                Course Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., B.Tech Computer Science"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  <Code2 className="text-muted-foreground h-3.5 w-3.5" />
                  Course Code
                </Label>
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
                  className="h-10 font-mono uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                  Department
                </Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departmentId: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select" />
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
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-xs">
                            {dept.code}
                          </span>
                          <span>{dept.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                Course Type
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {courseTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleCourseTypeChange(type.value)}
                    disabled={isLoading}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      formData.courseType === type.value
                        ? `${colorMap[type.color]} border-current`
                        : "bg-muted/50 hover:bg-muted border-transparent"
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {type.label.split(" ")[0]}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {type.defaultDuration} years
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="text-muted-foreground h-3.5 w-3.5" />
                  Duration (Years)
                </Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration: parseInt(value) })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-10">
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
                <Label
                  htmlFor="semestersPerYear"
                  className="flex items-center gap-2"
                >
                  <Layers className="text-muted-foreground h-3.5 w-3.5" />
                  Semesters/Year
                </Label>
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
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} per year
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.courseType && (
              <div className="bg-muted/30 flex items-start gap-2 rounded-lg border p-3">
                <Info className="text-primary mt-0.5 h-4 w-4" />
                <div className="text-sm">
                  <span className="font-medium">Total Semesters:</span>{" "}
                  <span className="text-primary font-semibold">
                    {totalSemesters}
                  </span>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {totalSemesters} semesters will be auto-created for this
                    course
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter className="pt-4">
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
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
