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
import { Plus } from "lucide-react";
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Subject</DialogTitle>
            <DialogDescription>
              Add a new subject to a semester
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Data Structures"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Subject Code</Label>
              <Input id="code" name="code" placeholder="e.g., CS201" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semesterId">Semester</Label>
              <Select name="semesterId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester._id} value={semester._id}>
                      {semester.courseId.departmentId.code} -{" "}
                      {semester.courseId.code} - {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credits">Credits</Label>
              <Select name="credits" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select credits" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((credit) => (
                    <SelectItem key={credit} value={credit.toString()}>
                      {credit} {credit === 1 ? "Credit" : "Credits"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
