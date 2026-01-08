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
import {
  Pencil,
  GraduationCap,
  User,
  CalendarDays,
  Building2,
} from "lucide-react";
import { assignClassCoordinator } from "@/lib/actions/academic.actions";
import { toast } from "sonner";

interface ClassCoordinator {
  _id: string;
  academicYear: string;
  classId: {
    _id: string;
    name: string;
    semesterId: {
      name: string;
      courseId: {
        code: string;
        departmentId: {
          code: string;
        };
      };
    };
  };
  professorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EditCoordinatorDialogProps {
  coordinator: ClassCoordinator;
  professors: Professor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCoordinatorDialog({
  coordinator,
  professors,
  open,
  onOpenChange,
}: EditCoordinatorDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      classId: coordinator.classId._id,
      professorId: formData.get("professorId") as string,
      academicYear: coordinator.academicYear,
    };

    const result = await assignClassCoordinator(data);

    if (result.success) {
      toast.success("Coordinator updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update coordinator");
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
                <DialogTitle>Change Class Coordinator</DialogTitle>
                <DialogDescription>
                  Update the coordinator for this class
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-4" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                Class
              </Label>
              <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/10">
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                </div>
                {coordinator.classId?.semesterId?.courseId?.departmentId?.code}{" "}
                - {coordinator.classId?.semesterId?.courseId?.code} -{" "}
                {coordinator.classId?.semesterId?.name} -{" "}
                {coordinator.classId?.name}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="text-muted-foreground h-3.5 w-3.5" />
                Academic Year
              </Label>
              <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                </div>
                {coordinator.academicYear}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="professorId" className="flex items-center gap-2">
                <User className="text-muted-foreground h-3.5 w-3.5" />
                New Coordinator
              </Label>
              <Select
                name="professorId"
                defaultValue={coordinator.professorId?._id}
              >
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
              {loading ? "Updating..." : "Update Coordinator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
