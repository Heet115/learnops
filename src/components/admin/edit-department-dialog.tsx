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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { updateDepartment } from "@/lib/actions/academic.actions";
import {
  Loader2,
  Building2,
  Code2,
  UserCheck,
  Info,
  Save,
} from "lucide-react";
import { IDepartment, IUser } from "@/lib/db";
import { toast } from "sonner";

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
      toast.success("Department updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update department");
      setError(result.error || "Failed to update department");
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle>Edit Department</DialogTitle>
                <Badge
                  variant="outline"
                  className={
                    department.isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                  }
                >
                  {department.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <DialogDescription>Update department details</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Department Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                Department Code
              </Label>
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
                className="h-10 font-mono uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hod" className="flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                Head of Department
              </Label>
              <Select
                value={formData.hodId}
                onValueChange={(value) =>
                  setFormData({ ...formData, hodId: value === "none" ? "" : value })
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select HOD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                  {hods.map((hod) => (
                    <SelectItem
                      key={(
                        hod._id as unknown as { toString(): string }
                      ).toString()}
                      value={(
                        hod._id as unknown as { toString(): string }
                      ).toString()}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10 text-xs font-medium text-violet-600">
                          {hod.firstName?.[0]}
                          {hod.lastName?.[0]}
                        </div>
                        {hod.firstName} {hod.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hods.length === 0 && (
                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-600">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>No HOD users available. Create HOD users first.</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <DialogFooter className="pt-4">
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
