"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { updateUser } from "@/lib/actions/admin.actions";
import { getAllDepartments } from "@/lib/actions/academic.actions";
import {
  Loader2,
  UserCog,
  Building2,
  AlertCircle,
  User,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { IUser } from "@/lib/db";

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: IUser;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
}: EditUserDialogProps) {
  const userId = (user._id as unknown as { toString(): string }).toString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <EditUserDialogContent
          key={userId}
          user={user}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  );
}

interface EditUserDialogContentProps {
  user: IUser;
  onOpenChange: (open: boolean) => void;
}

function EditUserDialogContent({
  user,
  onOpenChange,
}: EditUserDialogContentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<string>(
    user.departmentId?.toString() || "",
  );

  const userId = (user._id as unknown as { toString(): string }).toString();
  const isProfessor = user.role === "professor";

  useEffect(() => {
    if (isProfessor) {
      getAllDepartments().then((data) => {
        setDepartments(data || []);
      });
    }
  }, [isProfessor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await updateUser(userId, {
      departmentId: departmentId || null,
    });

    if (result.success) {
      toast.success("User updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update user");
      setError(result.error || "Failed to update user");
    }

    setIsLoading(false);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <UserCog className="text-primary h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and assignments
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* User Info (Read-only) */}
          <div className="bg-muted/50 space-y-3 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                {user.email}
              </span>
            </div>
          </div>

          <Separator />

          {/* Department Selection - only for professors */}
          {isProfessor && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="text-muted-foreground h-4 w-4" />
                Department
              </Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Assign this professor to a department for HOD visibility
              </p>
            </div>
          )}

          {!isProfessor && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Department assignment is only available for professors.
            </p>
          )}
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
          <Button type="submit" disabled={isLoading || !isProfessor}>
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
  );
}
