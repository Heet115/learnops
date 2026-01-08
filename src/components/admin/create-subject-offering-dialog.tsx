"use client";

import { useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  BookOpen,
  Calendar,
  GraduationCap,
  User,
  CalendarDays,
  Building2,
} from "lucide-react";
import { createSubjectOffering } from "@/lib/actions/academic.actions";
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

interface Subject {
  _id: string;
  name: string;
  code: string;
  semesterId: {
    _id: string;
  };
}

interface ClassItem {
  _id: string;
  name: string;
  academicYear: string;
  semesterId: {
    _id: string;
  };
}

interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CreateSubjectOfferingDialogProps {
  semesters: Semester[];
  subjects: Subject[];
  classes: ClassItem[];
  professors: Professor[];
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

export function CreateSubjectOfferingDialog({
  semesters,
  subjects,
  classes,
  professors,
}: CreateSubjectOfferingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("");
  const router = useRouter();

  const academicYears = getAcademicYearOptions();

  const filteredSubjects = useMemo(() => {
    if (!selectedSemester) return [];
    return subjects.filter((s) => s.semesterId?._id === selectedSemester);
  }, [selectedSemester, subjects]);

  const filteredClasses = useMemo(() => {
    if (!selectedSemester) return [];
    return classes.filter((c) => c.semesterId?._id === selectedSemester);
  }, [selectedSemester, classes]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      subjectId: formData.get("subjectId") as string,
      classId: formData.get("classId") as string,
      professorId: formData.get("professorId") as string,
      semesterId: selectedSemester,
      academicYear: formData.get("academicYear") as string,
    };

    const result = await createSubjectOffering(data);

    if (result.success) {
      toast.success("Subject offering created successfully");
      setOpen(false);
      setSelectedSemester("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create subject offering");
    }

    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setSelectedSemester("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Assign Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Create Subject Offering</DialogTitle>
                <DialogDescription>
                  Assign a professor to teach a subject for a class
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-4" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="semesterId" className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Semester
              </Label>
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester first" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester._id} value={semester._id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {semester.courseId.departmentId.code} -{" "}
                        {semester.courseId.code} - {semester.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subjectId" className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Subject
              </Label>
              <Select name="subjectId" required disabled={!selectedSemester}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedSemester
                        ? "Select subject"
                        : "Select semester first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      <span className="font-mono text-xs">{subject.code}</span>
                      <span className="mx-1">-</span>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="classId" className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                Class
              </Label>
              <Select name="classId" required disabled={!selectedSemester}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedSemester
                        ? "Select class"
                        : "Select semester first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {classItem.name}{" "}
                      <span className="text-muted-foreground">
                        ({classItem.academicYear})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="professorId" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Professor
              </Label>
              <Select name="professorId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select professor" />
                </SelectTrigger>
                <SelectContent>
                  {professors.map((prof) => (
                    <SelectItem key={prof._id} value={prof._id}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/10">
                          <User className="h-3 w-3 text-violet-600" />
                        </div>
                        {prof.firstName} {prof.lastName}
                        <span className="text-muted-foreground text-xs">
                          ({prof.email})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="academicYear" className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Academic Year
              </Label>
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
          <Separator className="my-4" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedSemester}>
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
