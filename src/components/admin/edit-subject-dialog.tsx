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
  BookMarked,
  Code2,
  Calendar,
  Award,
  Loader2,
  Save,
} from "lucide-react";
import { updateSubject } from "@/lib/actions/academic.actions";
import { toast } from "sonner";

interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
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

interface EditSubjectDialogProps {
  subject: Subject;
  semesters: Semester[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSubjectDialog({
  subject,
  semesters,
  open,
  onOpenChange,
}: EditSubjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(subject.isActive);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      semesterId: formData.get("semesterId") as string,
      credits: parseInt(formData.get("credits") as string, 10),
      isActive,
    };

    const result = await updateSubject(subject._id, data);

    if (result.success) {
      toast.success("Subject updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update subject");
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
                <BookMarked className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle>Edit Subject</DialogTitle>
                  <Badge
                    variant="outline"
                    className={
                      subject.isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    }
                  >
                    {subject.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <DialogDescription>Update subject details</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <BookMarked className="h-3.5 w-3.5 text-muted-foreground" />
                Subject Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={subject.name}
                required
                disabled={loading}
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Subject Code
                </Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={subject.code}
                  required
                  disabled={loading}
                  className="h-10 font-mono uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits" className="flex items-center gap-2">
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />
                  Credits
                </Label>
                <Select
                  name="credits"
                  defaultValue={subject.credits.toString()}
                  disabled={loading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((credit) => (
                      <SelectItem key={credit} value={credit.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-500/10 text-xs font-medium text-violet-600">
                            {credit}
                          </span>
                          <span>{credit === 1 ? "Credit" : "Credits"}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semesterId" className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Semester
              </Label>
              <Select
                name="semesterId"
                defaultValue={subject.semesterId._id}
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

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive subjects won&apos;t appear in offerings
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
