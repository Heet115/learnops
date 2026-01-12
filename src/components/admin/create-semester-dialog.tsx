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
import { DatePicker } from "@/components/ui/date-time-picker";
import { createSemester } from "@/lib/actions/academic.actions";
import {
  Loader2,
  Plus,
  Calendar,
  BookOpen,
  Hash,
  CalendarDays,
  Info,
} from "lucide-react";
import { ICourse } from "@/lib/db";
import { toast } from "sonner";

interface CreateSemesterDialogProps {
  courses: ICourse[];
}

export function CreateSemesterDialog({ courses }: CreateSemesterDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    number: 1,
    courseId: "",
  });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.courseId) {
      setError("Please select a course");
      setIsLoading(false);
      return;
    }

    const result = await createSemester({
      ...formData,
      startDate: startDate?.toISOString().split("T")[0] || "",
      endDate: endDate?.toISOString().split("T")[0] || "",
    });

    if (result.success) {
      toast.success("Semester created successfully");
      setOpen(false);
      setFormData({
        name: "",
        number: 1,
        courseId: "",
      });
      setStartDate(undefined);
      setEndDate(undefined);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create semester");
      setError(result.error || "Failed to create semester");
    }

    setIsLoading(false);
  };

  const selectedCourse = courses.find(
    (c) =>
      (c._id as unknown as { toString(): string }).toString() ===
      formData.courseId,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Semester
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Calendar className="text-primary h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create Semester</DialogTitle>
              <DialogDescription>
                Add a new semester to a course
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
              <Label htmlFor="course" className="flex items-center gap-2">
                <BookOpen className="text-muted-foreground h-3.5 w-3.5" />
                Course
              </Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, courseId: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem
                      key={(
                        course._id as unknown as { toString(): string }
                      ).toString()}
                      value={(
                        course._id as unknown as { toString(): string }
                      ).toString()}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-xs">
                          {course.code}
                        </span>
                        <span>{course.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCourse && (
                <p className="text-muted-foreground text-xs">
                  Selected: {selectedCourse.name}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                  Semester Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Semester 1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number" className="flex items-center gap-2">
                  <Hash className="text-muted-foreground h-3.5 w-3.5" />
                  Semester Number
                </Label>
                <Select
                  value={formData.number.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, number: parseInt(value) })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="bg-muted flex h-5 w-5 items-center justify-center rounded text-xs font-medium">
                            {num}
                          </span>
                          <span>Semester {num}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="text-muted-foreground h-3.5 w-3.5" />
                Duration
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <DatePicker
                  id="startDate"
                  label=""
                  value={startDate}
                  onChange={setStartDate}
                  disabled={isLoading}
                  placeholder="Start date"
                />
                <DatePicker
                  id="endDate"
                  label=""
                  value={endDate}
                  onChange={setEndDate}
                  disabled={isLoading}
                  placeholder="End date"
                />
              </div>
            </div>

            <div className="bg-muted/30 flex items-start gap-2 rounded-lg border p-3">
              <Info className="text-muted-foreground mt-0.5 h-4 w-4" />
              <p className="text-muted-foreground text-xs">
                Semesters are typically auto-created when you create a course.
                Use this form to add additional semesters if needed.
              </p>
            </div>
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
                  Create Semester
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
