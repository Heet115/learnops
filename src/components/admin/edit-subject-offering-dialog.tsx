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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Pencil, BookOpen, GraduationCap, User, Power } from "lucide-react";
import { updateSubjectOffering } from "@/lib/actions/academic.actions";
import { toast } from "sonner";

interface SubjectOffering {
  _id: string;
  isActive: boolean;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  classId: {
    _id: string;
    name: string;
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

interface EditSubjectOfferingDialogProps {
  offering: SubjectOffering;
  professors: Professor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSubjectOfferingDialog({
  offering,
  professors,
  open,
  onOpenChange,
}: EditSubjectOfferingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(offering.isActive);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      professorId: formData.get("professorId") as string,
      isActive,
    };

    const result = await updateSubjectOffering(offering._id, data);

    if (result.success) {
      toast.success("Subject offering updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update subject offering");
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
                <DialogTitle>Edit Subject Offering</DialogTitle>
                <DialogDescription>
                  Update assignment for {offering.subjectId?.code} -{" "}
                  {offering.classId?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-4" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <BookOpen className="text-muted-foreground h-3.5 w-3.5" />
                Subject
              </Label>
              <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="font-mono text-xs">
                  {offering.subjectId?.code}
                </span>
                <span className="mx-1">-</span>
                {offering.subjectId?.name}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                Class
              </Label>
              <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10">
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                {offering.classId?.name}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="professorId" className="flex items-center gap-2">
                <User className="text-muted-foreground h-3.5 w-3.5" />
                Professor
              </Label>
              <Select
                name="professorId"
                defaultValue={offering.professorId?._id}
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

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Power className="text-muted-foreground h-4 w-4" />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active Status
                </Label>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
