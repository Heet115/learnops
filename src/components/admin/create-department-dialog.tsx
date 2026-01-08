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
  DialogTrigger,
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
import { createDepartment } from "@/lib/actions/academic.actions";
import { Loader2, Plus, Building2, Code2, UserCheck, Info } from "lucide-react";
import { IUser } from "@/lib/db";
import { toast } from "sonner";

interface CreateDepartmentDialogProps {
  hods: IUser[];
}

export function CreateDepartmentDialog({ hods }: CreateDepartmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    hodId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await createDepartment({
      name: formData.name,
      code: formData.code,
      hodId: formData.hodId || undefined,
    });

    if (result.success) {
      toast.success("Department created successfully");
      setOpen(false);
      setFormData({ name: "", code: "", hodId: "" });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create department");
      setError(result.error || "Failed to create department");
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Building2 className="text-primary h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create Department</DialogTitle>
              <DialogDescription>
                Add a new academic department
              </DialogDescription>
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
                <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                Department Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Computer Science & Engineering"
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
                <Code2 className="text-muted-foreground h-3.5 w-3.5" />
                Department Code
              </Label>
              <Input
                id="code"
                placeholder="e.g., CSE"
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
              <p className="text-muted-foreground text-xs">
                Short unique identifier (max 10 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hod" className="flex items-center gap-2">
                <UserCheck className="text-muted-foreground h-3.5 w-3.5" />
                Head of Department
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Select
                value={formData.hodId}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    hodId: value === "none" ? "" : value,
                  })
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
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Department
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
