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
import { Input } from "@/components/ui/input";
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
  BookMarked,
  Code2,
  Calendar,
  Award,
  Loader2,
} from "lucide-react";
import { createSubject } from "@/lib/actions/academic.actions";
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

interface CreateSubjectDialogProps {
  semesters: Semester[];
}

export function CreateSubjectDialog({ semesters }: CreateSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    };

    const result = await createSubject(data);

    if (result.success) {
      toast.success("Subject created successfully");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create subject");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 pb-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <BookMarked className="text-primary h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Create Subject</DialogTitle>
                <DialogDescription>
                  Add a new subject to a semester
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <BookMarked className="text-muted-foreground h-3.5 w-3.5" />
                Subject Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Data Structures"
                required
                disabled={loading}
                className="h-10"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  <Code2 className="text-muted-foreground h-3.5 w-3.5" />
                  Subject Code
                </Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="e.g., CS201"
                  required
                  disabled={loading}
                  className="h-10 font-mono uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits" className="flex items-center gap-2">
                  <Award className="text-muted-foreground h-3.5 w-3.5" />
                  Credits
                </Label>
                <Select name="credits" required disabled={loading}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select" />
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
                <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                Semester
              </Label>
              <Select name="semesterId" required disabled={loading}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester._id} value={semester._id}>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-xs">
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
          </div>

          <Separator />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Subject
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
