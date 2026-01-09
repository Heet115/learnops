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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  FileText,
  BookMarked,
  Calendar,
  Award,
  Users,
  FileType,
  HardDrive,
} from "lucide-react";
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
  const [groupFormation, setGroupFormation] = useState<"student" | "professor">(
    "student",
  );
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(["pdf"]);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [lateDeadline, setLateDeadline] = useState<Date | undefined>(undefined);
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
      deadline: deadline?.toISOString() || "",
      allowLateSubmission,
      lateDeadline: allowLateSubmission && lateDeadline ? lateDeadline.toISOString() : undefined,
      latePenaltyPercent: allowLateSubmission ? Number(formData.get("latePenaltyPercent") || 0) : 0,
      maxMarks: Number(formData.get("maxMarks")),
      isGroupSubmission,
      groupFormation: isGroupSubmission ? groupFormation : undefined,
      maxGroupSize: isGroupSubmission
        ? Number(formData.get("maxGroupSize"))
        : undefined,
      allowedFileTypes: selectedFileTypes,
      maxFileSize: Number(formData.get("maxFileSize")),
    };

    const result = await createALA(data);

    if (result.success) {
      toast.success("ALA created successfully");
      setOpen(false);
      setIsGroupSubmission(false);
      setGroupFormation("student");
      setSelectedFileTypes(["pdf"]);
      setDeadline(undefined);
      setAllowLateSubmission(false);
      setLateDeadline(undefined);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <FileText className="text-primary h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Create New ALA</DialogTitle>
                <DialogDescription>
                  Create an Active Learning Activity for your students.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-4" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label
                htmlFor="subjectOfferingId"
                className="flex items-center gap-2"
              >
                <BookMarked className="text-muted-foreground h-4 w-4" />
                Subject & Class
              </Label>
              <Select name="subjectOfferingId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {offerings.map((o) => (
                    <SelectItem key={o._id} value={o._id}>
                      {o.subjectId.code} - {o.subjectId.name} | {o.classId.name}{" "}
                      ({o.academicYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="text-muted-foreground h-4 w-4" />
                Title
              </Label>
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
                <Label className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  Deadline
                </Label>
                <DateTimePicker
                  id="deadline"
                  value={deadline}
                  onChange={setDeadline}
                  required
                  placeholder="Select deadline"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxMarks" className="flex items-center gap-2">
                  <Award className="text-muted-foreground h-4 w-4" />
                  Max Marks
                </Label>
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

            {/* Late Submission Section */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowLateSubmission"
                checked={allowLateSubmission}
                onCheckedChange={(checked) =>
                  setAllowLateSubmission(checked as boolean)
                }
              />
              <label
                htmlFor="allowLateSubmission"
                className="flex items-center gap-2 text-sm"
              >
                <Calendar className="text-muted-foreground h-4 w-4" />
                Allow late submissions
              </label>
            </div>

            {allowLateSubmission && (
              <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Late Deadline</Label>
                    <DateTimePicker
                      id="lateDeadline"
                      value={lateDeadline}
                      onChange={setLateDeadline}
                      placeholder="Select late deadline"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="latePenaltyPercent">Penalty (%)</Label>
                    <Input
                      id="latePenaltyPercent"
                      name="latePenaltyPercent"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={10}
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Late submissions will have the penalty percentage deducted from their marks.
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="maxFileSize" className="flex items-center gap-2">
                <HardDrive className="text-muted-foreground h-4 w-4" />
                Max File Size (MB)
              </Label>
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
              <Label className="flex items-center gap-2">
                <FileType className="text-muted-foreground h-4 w-4" />
                Allowed File Types
              </Label>
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
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm uppercase"
                    >
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
                onCheckedChange={(checked) =>
                  setIsGroupSubmission(checked as boolean)
                }
              />
              <label
                htmlFor="isGroupSubmission"
                className="flex items-center gap-2 text-sm"
              >
                <Users className="text-muted-foreground h-4 w-4" />
                Allow group submissions
              </label>
            </div>

            {isGroupSubmission && (
              <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
                <div className="grid gap-2">
                  <Label>Group Formation</Label>
                  <RadioGroup
                    value={groupFormation}
                    onValueChange={(v) =>
                      setGroupFormation(v as "student" | "professor")
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="student-formed" />
                      <Label
                        htmlFor="student-formed"
                        className="cursor-pointer font-normal"
                      >
                        Students create groups
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="professor" id="professor-formed" />
                      <Label
                        htmlFor="professor-formed"
                        className="cursor-pointer font-normal"
                      >
                        I will assign groups
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-muted-foreground text-xs">
                    {groupFormation === "student"
                      ? "Students will create their own groups and invite classmates"
                      : "You will create groups and assign students after creating the ALA"}
                  </p>
                </div>

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
              </div>
            )}
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
            <Button
              type="submit"
              disabled={loading || selectedFileTypes.length === 0 || !deadline}
            >
              {loading ? "Creating..." : "Create ALA"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
