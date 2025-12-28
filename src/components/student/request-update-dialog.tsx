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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { createProfileUpdateRequest } from "@/lib/actions/student-profile.actions";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CurrentProfile {
  alternateEmail: string;
  presentAddressLine1: string;
  presentAddressLine2: string;
  presentCity: string;
  presentState: string;
  presentCountry: string;
  presentPostalCode: string;
}

interface RequestUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: CurrentProfile;
}

const editableFields = [
  { key: "alternateEmail", label: "Alternate Email", type: "email" },
  { key: "presentAddressLine1", label: "Address Line 1", type: "text" },
  { key: "presentAddressLine2", label: "Address Line 2", type: "text" },
  { key: "presentCity", label: "City / District", type: "text" },
  { key: "presentState", label: "State", type: "text" },
  { key: "presentCountry", label: "Country", type: "text" },
  { key: "presentPostalCode", label: "Postal Code", type: "text" },
] as const;

export function RequestUpdateDialog({
  open,
  onOpenChange,
  currentProfile,
}: RequestUpdateDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<CurrentProfile>(currentProfile);

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    const newSelected = new Set(selectedFields);
    if (checked) {
      newSelected.add(fieldKey);
    } else {
      newSelected.delete(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (selectedFields.size === 0) {
      setError("Please select at least one field to update");
      setIsLoading(false);
      return;
    }

    // Build requested changes
    const requestedChanges = Array.from(selectedFields).map((fieldKey) => {
      const field = editableFields.find((f) => f.key === fieldKey)!;
      return {
        fieldKey,
        fieldLabel: field.label,
        currentValue: currentProfile[fieldKey as keyof CurrentProfile] || null,
        requestedValue: formData[fieldKey as keyof CurrentProfile],
      };
    });

    // Validate that at least one value is different
    const hasChanges = requestedChanges.some(
      (change) => change.currentValue !== change.requestedValue
    );

    if (!hasChanges) {
      setError("Please enter different values for the selected fields");
      setIsLoading(false);
      return;
    }

    const result = await createProfileUpdateRequest({ requestedChanges });

    if (result.success) {
      toast.success("Update request submitted successfully");
      onOpenChange(false);
      setSelectedFields(new Set());
      router.refresh();
    } else {
      toast.error(result.error || "Failed to submit request");
      setError(result.error || "Failed to submit request");
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setSelectedFields(new Set());
    setFormData(currentProfile);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Profile Update</DialogTitle>
          <DialogDescription>
            Select the fields you want to update. Your request will be reviewed
            by an administrator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only contact and address information can be updated. For other
                changes, please contact the administrator directly.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {editableFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`check-${field.key}`}
                      checked={selectedFields.has(field.key)}
                      onCheckedChange={(checked) =>
                        handleFieldToggle(field.key, checked as boolean)
                      }
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor={`check-${field.key}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {field.label}
                    </Label>
                  </div>

                  {selectedFields.has(field.key) && (
                    <div className="ml-6 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Current:{" "}
                        {currentProfile[field.key as keyof CurrentProfile] ||
                          "(empty)"}
                      </p>
                      <Input
                        type={field.type}
                        placeholder={`New ${field.label.toLowerCase()}`}
                        value={formData[field.key as keyof CurrentProfile]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.key]: e.target.value,
                          })
                        }
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || selectedFields.size === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
