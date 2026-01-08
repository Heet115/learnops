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
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  GraduationCap,
  User,
  CalendarDays,
  Building2,
} from "lucide-react";
import { assignClassCoordinator } from "@/lib/actions/academic.actions";
import { toast } from "sonner";

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

interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AssignCoordinatorDialogProps {
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

export function AssignCoordinatorDialog({
  classes,
  professors,
}: AssignCoordinatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const academicYears = getAcademicYearOptions();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      classId: formData.get("classId") as string,
      professorId: formData.get("professorId") as string,
      academicYear: formData.get("academicYear") as string,
    };

    const result = await assignClassCoordinator(data);

    if (result.success) {
      toast.success("Class coordinator assigned successfully");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to assign coordinator");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Crown className="mr-2 h-4 w-4" />
          Assign Coordinator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle>Assign Class Coordinator</DialogTitle>
                <DialogDescription>
                  Assign a professor as the coordinator for a class
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-4" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="classId" className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                Class
              </Label>
              <Select name="classId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {classItem.semesterId?.courseId?.departmentId?.code} -{" "}
                        {classItem.semesterId?.courseId?.code} -{" "}
                        {classItem.semesterId?.name} - {classItem.name}
                      </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Assigning..." : "Assign Coordinator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
