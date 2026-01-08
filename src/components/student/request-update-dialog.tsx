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
import {
  Loader2,
  AlertCircle,
  FileEdit,
  User,
  Phone,
  MapPin,
} from "lucide-react";
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
    icon: User,
    color: "blue",
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
    icon: Phone,
    color: "emerald",
    fields: [
      { key: "email", label: "Primary Email", type: "email" },
      { key: "alternateEmail", label: "Alternate Email", type: "email" },
      { key: "primaryMobile", label: "Primary Mobile Number", type: "tel" },
      { key: "alternateMobile", label: "Alternate Mobile Number", type: "tel" },
    ],
  },
  {
    title: "Address",
    icon: MapPin,
    color: "amber",
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

const groupColorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/10 text-amber-600",
};

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
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <FileEdit className="text-primary h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Request Profile Update</DialogTitle>
              <DialogDescription>
                Select fields to update. Your request will be reviewed by an
                administrator.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Separator />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {editableFieldGroups.map((group, groupIdx) => {
                const IconComponent = group.icon;
                return (
                  <div key={group.title} className="space-y-3">
                    {groupIdx > 0 && <Separator />}
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${groupColorMap[group.color]}`}
                      >
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                      <h4 className="text-sm font-semibold">{group.title}</h4>
                    </div>
                    <div className="space-y-3 pl-8">
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
                            <div className="bg-muted/30 ml-6 space-y-1.5 rounded-lg border p-3">
                              <p className="text-muted-foreground text-xs">
                                Current:{" "}
                                <span className="text-foreground font-medium">
                                  {formatDisplayValue(
                                    field,
                                    currentProfile[
                                      field.key as keyof CurrentProfile
                                    ],
                                  )}
                                </span>
                              </p>
                              {field.type === "select" ? (
                                <Select
                                  value={
                                    formData[field.key as keyof CurrentProfile]
                                  }
                                  onValueChange={(value) =>
                                    setFormData({
                                      ...formData,
                                      [field.key]: value,
                                    })
                                  }
                                  disabled={isLoading}
                                >
                                  <SelectTrigger className="bg-background">
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
                                  className="bg-background"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="shrink-0" />
          <DialogFooter className="shrink-0 p-6 pt-4">
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
