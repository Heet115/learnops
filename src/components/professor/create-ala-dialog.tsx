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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { createALA } from "@/lib/actions/ala.actions";
import { ALLOWED_FILE_TYPES } from "@/lib/validations/ala.validation";
import { toast } from "sonner";

interface SubjectOffering {
  _id: string;
  academicYear: string;
  subjectId: { _id: string; name: string; code: string };
  classId: { _id: string; name: string };
  semesterId: { _id: string; name: string; number: number };
}

interface CreateALADialogProps {
  offerings: SubjectOffering[];
}

export function CreateALADialog({ offerings }: CreateALADialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGroupSubmission, setIsGroupSubmission] = useState(false);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(["pdf"]);
  const router = useRouter();

  const handleFileTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedFileTypes([...selectedFileTypes, type]);
    } else {
      setSelectedFileTypes(selectedFileTypes.filter((t) => t !== type));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      subjectOfferingId: formData.get("subjectOfferingId") as string,
      deadline: formData.get("deadline") as string,
      maxMarks: Number(formData.get("maxMarks")),
      isGroupSubmission,
      maxGroupSize: isGroupSubmission ? Number(formData.get("maxGroupSize")) : undefined,
      allowedFileTypes: selectedFileTypes,
      maxFileSize: Number(formData.get("maxFileSize")),
    };

    const result = await createALA(data);

    if (result.success) {
      toast.success("ALA created successfully");
      setOpen(false);
      setIsGroupSubmission(false);
      setSelectedFileTypes(["pdf"]);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create ALA");
    }

    setLoading(false);
  };

  if (offerings.length === 0) {
    return (
      <Button disabled>
        <Plus className="mr-2 h-4 w-4" />
        Create ALA
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create ALA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New ALA</DialogTitle>
            <DialogDescription>
              Create an Active Learning Activity for your students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subjectOfferingId">Subject & Class</Label>
              <Select name="subjectOfferingId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {offerings.map((o) => (
                    <SelectItem key={o._id} value={o._id}>
                      {o.subjectId.code} - {o.subjectId.name} | {o.classId.name} ({o.academicYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Assignment 1: Data Structures"
                required
                minLength={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the activity, requirements, and expectations..."
                required
                minLength={10}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxMarks">Max Marks</Label>
                <Input
                  id="maxMarks"
                  name="maxMarks"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={10}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                name="maxFileSize"
                type="number"
                min={1}
                max={30}
                defaultValue={30}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Allowed File Types</Label>
              <div className="flex flex-wrap gap-4">
                {ALLOWED_FILE_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedFileTypes.includes(type)}
                      onCheckedChange={(checked) =>
                        handleFileTypeChange(type, checked as boolean)
                      }
                    />
                    <label htmlFor={`type-${type}`} className="text-sm uppercase">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isGroupSubmission"
                checked={isGroupSubmission}
                onCheckedChange={(checked) => setIsGroupSubmission(checked as boolean)}
              />
              <label htmlFor="isGroupSubmission" className="text-sm">
                Allow group submissions
              </label>
            </div>

            {isGroupSubmission && (
              <div className="grid gap-2">
                <Label htmlFor="maxGroupSize">Max Group Size</Label>
                <Input
                  id="maxGroupSize"
                  name="maxGroupSize"
                  type="number"
                  min={2}
                  max={10}
                  defaultValue={4}
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedFileTypes.length === 0}>
              {loading ? "Creating..." : "Create ALA"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
