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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Pencil,
  FileText,
  Calendar,
  Award,
  Users,
  FileType,
  HardDrive,
} from "lucide-react";
import { updateALA } from "@/lib/actions/ala.actions";
import { ALLOWED_FILE_TYPES } from "@/lib/validations/ala.validation";
import { toast } from "sonner";

interface ALA {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  isGroupSubmission: boolean;
  maxGroupSize?: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
}

interface EditALADialogProps {
  ala: ALA;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditALADialog({ ala, open, onOpenChange }: EditALADialogProps) {
  const [loading, setLoading] = useState(false);
  const [isGroupSubmission, setIsGroupSubmission] = useState(
    ala.isGroupSubmission
  );
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(
    ala.allowedFileTypes || ["pdf"]
  );
  const [deadline, setDeadline] = useState<Date | undefined>(
    new Date(ala.deadline)
  );
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
      deadline: deadline?.toISOString() || "",
      maxMarks: Number(formData.get("maxMarks")),
      isGroupSubmission,
      maxGroupSize: isGroupSubmission
        ? Number(formData.get("maxGroupSize"))
        : null,
      allowedFileTypes: selectedFileTypes,
      maxFileSize: Number(formData.get("maxFileSize")),
    };

    const result = await updateALA(ala._id, data);

    if (result.success) {
      toast.success("ALA updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update ALA");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <Pencil className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <DialogTitle>Edit ALA</DialogTitle>
                <DialogDescription>Update the ALA details.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-4" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Title
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={ala.title}
                required
                minLength={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={ala.description}
                required
                minLength={10}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
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
                  <Award className="h-4 w-4 text-muted-foreground" />
                  Max Marks
                </Label>
                <Input
                  id="maxMarks"
                  name="maxMarks"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={ala.maxMarks}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxFileSize" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                Max File Size (MB)
              </Label>
              <Input
                id="maxFileSize"
                name="maxFileSize"
                type="number"
                min={1}
                max={30}
                defaultValue={
                  ala.maxFileSize ? ala.maxFileSize / (1024 * 1024) : 30
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <FileType className="h-4 w-4 text-muted-foreground" />
                Allowed File Types
              </Label>
              <div className="flex flex-wrap gap-4">
                {ALLOWED_FILE_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-type-${type}`}
                      checked={selectedFileTypes.includes(type)}
                      onCheckedChange={(checked) =>
                        handleFileTypeChange(type, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`edit-type-${type}`}
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
                id="edit-isGroupSubmission"
                checked={isGroupSubmission}
                onCheckedChange={(checked) =>
                  setIsGroupSubmission(checked as boolean)
                }
              />
              <label
                htmlFor="edit-isGroupSubmission"
                className="flex items-center gap-2 text-sm"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                Allow group submissions
              </label>
            </div>

            {isGroupSubmission && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxGroupSize">Max Group Size</Label>
                  <Input
                    id="maxGroupSize"
                    name="maxGroupSize"
                    type="number"
                    min={2}
                    max={10}
                    defaultValue={ala.maxGroupSize || 4}
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedFileTypes.length === 0 || !deadline}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
