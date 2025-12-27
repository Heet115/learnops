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
            <DialogTitle>Edit Subject Offering</DialogTitle>
            <DialogDescription>
              Update assignment for {offering.subjectId?.code} -{" "}
              {offering.classId?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Subject</Label>
              <div className="bg-muted rounded-md border px-3 py-2 text-sm">
                {offering.subjectId?.code} - {offering.subjectId?.name}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Class</Label>
              <div className="bg-muted rounded-md border px-3 py-2 text-sm">
                {offering.classId?.name}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="professorId">Professor</Label>
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
                      {prof.firstName} {prof.lastName} ({prof.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
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
