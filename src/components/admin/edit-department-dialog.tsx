"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateDepartment } from "@/lib/actions/academic.actions";
import { Loader2 } from "lucide-react";
import { IDepartment, IUser } from "@/lib/db";

interface EditDepartmentDialogProps {
  department: IDepartment;
  hods: IUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDepartmentDialog({
  department,
  hods,
  open,
  onOpenChange,
}: EditDepartmentDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const hodId = department.hodId as unknown as
    | { toString(): string }
    | undefined;

  const [formData, setFormData] = useState({
    name: department.name,
    code: department.code,
    hodId: hodId?.toString() || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const id = (department._id as unknown as { toString(): string }).toString();
    const result = await updateDepartment(id, {
      name: formData.name,
      code: formData.code,
      hodId: formData.hodId || null,
    });

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error || "Failed to update department");
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Department Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                required
                disabled={isLoading}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hod">Head of Department</Label>
              <Select
                value={formData.hodId}
                onValueChange={(value) =>
                  setFormData({ ...formData, hodId: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select HOD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {hods.map((hod) => (
                    <SelectItem
                      key={(
                        hod._id as unknown as { toString(): string }
                      ).toString()}
                      value={(
                        hod._id as unknown as { toString(): string }
                      ).toString()}
                    >
                      {hod.firstName} {hod.lastName}
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
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
