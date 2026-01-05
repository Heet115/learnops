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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { createProfileUpdateRequest } from "@/lib/actions/student-profile.actions";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CurrentProfile {
  firstName: string;
  middleName: string;
  lastName: string;
  fatherName: string;
  motherName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  email: string;
  alternateEmail: string;
  primaryMobile: string;
  alternateMobile: string;
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

const editableFieldGroups = [
  {
    title: "Identity Information",
    fields: [
      { key: "firstName", label: "First Name", type: "text" },
      { key: "middleName", label: "Middle Name", type: "text" },
      { key: "lastName", label: "Last Name", type: "text" },
      { key: "fatherName", label: "Father's Name", type: "text" },
      { key: "motherName", label: "Mother's Name", type: "text" },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["male", "female", "other"],
      },
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
      {
        key: "bloodGroup",
        label: "Blood Group",
        type: "select",
        options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
    ],
  },
  {
    title: "Contact Information",
    fields: [
      { key: "email", label: "Primary Email", type: "email" },
      { key: "alternateEmail", label: "Alternate Email", type: "email" },
      { key: "primaryMobile", label: "Primary Mobile Number", type: "tel" },
      { key: "alternateMobile", label: "Alternate Mobile Number", type: "tel" },
    ],
  },
  {
    title: "Address",
    fields: [
      { key: "presentAddressLine1", label: "Address Line 1", type: "text" },
      { key: "presentAddressLine2", label: "Address Line 2", type: "text" },
      { key: "presentCity", label: "City / District", type: "text" },
      { key: "presentState", label: "State", type: "text" },
      { key: "presentCountry", label: "Country", type: "text" },
      { key: "presentPostalCode", label: "Postal Code", type: "text" },
    ],
  },
];

const allEditableFields = editableFieldGroups.flatMap((g) => g.fields);

const genderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

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
      const field = allEditableFields.find((f) => f.key === fieldKey)!;
      return {
        fieldKey,
        fieldLabel: field.label,
        currentValue: currentProfile[fieldKey as keyof CurrentProfile] || null,
        requestedValue: formData[fieldKey as keyof CurrentProfile],
      };
    });

    // Validate that at least one value is different
    const hasChanges = requestedChanges.some(
      (change) => change.currentValue !== change.requestedValue,
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

  const formatDisplayValue = (
    field: (typeof allEditableFields)[0],
    value: string,
  ) => {
    if (!value) return "(empty)";
    if (field.key === "gender") return genderLabels[value] || value;
    if (field.key === "dateOfBirth") {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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

            {editableFieldGroups.map((group, groupIdx) => (
              <div key={group.title} className="space-y-3">
                {groupIdx > 0 && <Separator />}
                <h4 className="text-muted-foreground text-sm font-semibold">
                  {group.title}
                </h4>
                <div className="space-y-3">
                  {group.fields.map((field) => (
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
                          className="cursor-pointer text-sm font-medium"
                        >
                          {field.label}
                        </Label>
                      </div>

                      {selectedFields.has(field.key) && (
                        <div className="ml-6 space-y-1">
                          <p className="text-muted-foreground text-xs">
                            Current:{" "}
                            {formatDisplayValue(
                              field,
                              currentProfile[field.key as keyof CurrentProfile],
                            )}
                          </p>
                          {field.type === "select" ? (
                            <Select
                              value={
                                formData[field.key as keyof CurrentProfile]
                              }
                              onValueChange={(value) =>
                                setFormData({ ...formData, [field.key]: value })
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={`Select ${field.label.toLowerCase()}`}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {field.key === "gender"
                                      ? genderLabels[opt] || opt
                                      : opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={field.type}
                              placeholder={`New ${field.label.toLowerCase()}`}
                              value={
                                formData[field.key as keyof CurrentProfile]
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  [field.key]: e.target.value,
                                })
                              }
                              disabled={isLoading}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
            <Button
              type="submit"
              disabled={isLoading || selectedFields.size === 0}
            >
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
