"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-time-picker";
import {
  createStudentProfile,
  updateStudentProfile,
  getStudentProfile,
} from "@/lib/actions/student-profile.actions";
import {
  Loader2,
  User,
  GraduationCap,
  Phone,
  MapPin,
  AlertCircle,
  Save,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface StudentProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  courses: Course[];
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const studentStatusOptions = [
  { value: "active", label: "Active", color: "bg-emerald-500" },
  { value: "regular", label: "Regular", color: "bg-blue-500" },
  { value: "detained", label: "Detained", color: "bg-orange-500" },
  { value: "alumni", label: "Alumni", color: "bg-purple-500" },
];

export function StudentProfileDialog({
  open,
  onOpenChange,
  userId,
  userName,
  courses,
}: StudentProfileDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");

  const [formData, setFormData] = useState({
    studentId: "",
    enrollmentNumber: "",
    middleName: "",
    fatherName: "",
    motherName: "",
    gender: "",
    dateOfBirth: undefined as Date | undefined,
    bloodGroup: "",
    alternateEmail: "",
    primaryMobile: "",
    alternateMobile: "",
    courseId: "",
    batch: "",
    academicSession: "",
    rollNumber: "",
    admissionDate: undefined as Date | undefined,
    studentStatus: "active",
    presentAddressLine1: "",
    presentAddressLine2: "",
    presentCity: "",
    presentState: "",
    presentCountry: "",
    presentPostalCode: "",
  });

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    let isMounted = true;
    let fetchStarted = false;

    // Use a microtask to batch the state update
    Promise.resolve().then(() => {
      if (isMounted && !fetchStarted) {
        fetchStarted = true;
        setIsFetching(true);
      }
    });

    getStudentProfile(userId).then((profile) => {
      if (!isMounted) return;

      if (profile) {
        setIsEdit(true);
        setFormData({
          studentId: profile.studentId || "",
          enrollmentNumber: profile.enrollmentNumber || "",
          middleName: profile.middleName || "",
          fatherName: profile.fatherName || "",
          motherName: profile.motherName || "",
          gender: profile.gender || "",
          dateOfBirth: profile.dateOfBirth
            ? new Date(profile.dateOfBirth)
            : undefined,
          bloodGroup: profile.bloodGroup || "",
          alternateEmail: profile.alternateEmail || "",
          primaryMobile: profile.primaryMobile || "",
          alternateMobile: profile.alternateMobile || "",
          courseId: profile.courseId?._id || profile.courseId || "",
          batch: profile.batch || "",
          academicSession: profile.academicSession || "",
          rollNumber: profile.rollNumber || "",
          admissionDate: profile.admissionDate
            ? new Date(profile.admissionDate)
            : undefined,
          studentStatus: profile.studentStatus || "active",
          presentAddressLine1: profile.presentAddressLine1 || "",
          presentAddressLine2: profile.presentAddressLine2 || "",
          presentCity: profile.presentCity || "",
          presentState: profile.presentState || "",
          presentCountry: profile.presentCountry || "",
          presentPostalCode: profile.presentPostalCode || "",
        });
      } else {
        setIsEdit(false);
      }
      setIsFetching(false);
    });

    return () => {
      isMounted = false;
    };
  }, [open, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.studentId.trim()) {
      setError("Student ID is required");
      setIsLoading(false);
      setActiveTab("identity");
      return;
    }

    const submitData = {
      ...formData,
      gender: (formData.gender || undefined) as
        | "male"
        | "female"
        | "other"
        | undefined,
      bloodGroup: (formData.bloodGroup || undefined) as
        | "A+"
        | "A-"
        | "B+"
        | "B-"
        | "AB+"
        | "AB-"
        | "O+"
        | "O-"
        | undefined,
      courseId: formData.courseId || undefined,
      dateOfBirth: formData.dateOfBirth
        ? formData.dateOfBirth.toISOString().split("T")[0]
        : undefined,
      admissionDate: formData.admissionDate
        ? formData.admissionDate.toISOString().split("T")[0]
        : undefined,
      studentStatus: formData.studentStatus as
        | "active"
        | "regular"
        | "detained"
        | "alumni",
    };

    let result;
    if (isEdit) {
      result = await updateStudentProfile(userId, submitData);
    } else {
      result = await createStudentProfile({ ...submitData, userId });
    }

    if (result.success) {
      toast.success(isEdit ? "Profile updated" : "Profile created");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save profile");
      setError(result.error || "Failed to save profile");
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setError("");
    setActiveTab("identity");
    onOpenChange(false);
  };

  const currentStatus = studentStatusOptions.find(
    (s) => s.value === formData.studentStatus,
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <UserCog className="text-primary h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle>
                  {isEdit ? "Edit" : "Create"} Student Profile
                </DialogTitle>
                {isEdit && currentStatus && (
                  <Badge variant="outline" className="gap-1">
                    <span
                      className={`h-2 w-2 rounded-full ${currentStatus.color}`}
                    />
                    {currentStatus.label}
                  </Badge>
                )}
              </div>
              <DialogDescription>{userName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {isFetching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-2 text-sm">
                Loading profile...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="identity" className="gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Identity</span>
                </TabsTrigger>
                <TabsTrigger value="academic" className="gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Academic</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Contact</span>
                </TabsTrigger>
                <TabsTrigger value="address" className="gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Address</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="studentId" className="text-sm">
                      Student ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="studentId"
                      placeholder="e.g., STU2024001"
                      value={formData.studentId}
                      onChange={(e) =>
                        setFormData({ ...formData, studentId: e.target.value })
                      }
                      disabled={isLoading || isEdit}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentNumber" className="text-sm">
                      Enrollment Number
                    </Label>
                    <Input
                      id="enrollmentNumber"
                      placeholder="e.g., EN2024001"
                      value={formData.enrollmentNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enrollmentNumber: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName" className="text-sm">
                    Middle Name
                  </Label>
                  <Input
                    id="middleName"
                    placeholder="Middle name (optional)"
                    value={formData.middleName}
                    onChange={(e) =>
                      setFormData({ ...formData, middleName: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName" className="text-sm">
                      Father&apos;s Name
                    </Label>
                    <Input
                      id="fatherName"
                      placeholder="Father's full name"
                      value={formData.fatherName}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherName: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherName" className="text-sm">
                      Mother&apos;s Name
                    </Label>
                    <Input
                      id="motherName"
                      placeholder="Mother's full name"
                      value={formData.motherName}
                      onChange={(e) =>
                        setFormData({ ...formData, motherName: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm">
                      Gender
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gender: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Date of Birth</Label>
                    <DatePicker
                      value={formData.dateOfBirth}
                      onChange={(date) =>
                        setFormData({ ...formData, dateOfBirth: date })
                      }
                      disabled={isLoading}
                      placeholder="Select date"
                    />
                  </div>
                  <div className="col-span-2 space-y-2 sm:col-span-1">
                    <Label htmlFor="bloodGroup" className="text-sm">
                      Blood Group
                    </Label>
                    <Select
                      value={formData.bloodGroup}
                      onValueChange={(value) =>
                        setFormData({ ...formData, bloodGroup: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroupOptions.map((bg) => (
                          <SelectItem key={bg} value={bg}>
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="courseId" className="text-sm">
                      Course
                    </Label>
                    <Select
                      value={formData.courseId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, courseId: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentStatus" className="text-sm">
                      Status
                    </Label>
                    <Select
                      value={formData.studentStatus}
                      onValueChange={(value) =>
                        setFormData({ ...formData, studentStatus: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {studentStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${opt.color}`}
                              />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="batch" className="text-sm">
                      Batch
                    </Label>
                    <Input
                      id="batch"
                      placeholder="e.g., 2024-28"
                      value={formData.batch}
                      onChange={(e) =>
                        setFormData({ ...formData, batch: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academicSession" className="text-sm">
                      Academic Session
                    </Label>
                    <Input
                      id="academicSession"
                      placeholder="e.g., 2024-25"
                      value={formData.academicSession}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          academicSession: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber" className="text-sm">
                      Roll Number
                    </Label>
                    <Input
                      id="rollNumber"
                      placeholder="e.g., 101"
                      value={formData.rollNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, rollNumber: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Admission Date</Label>
                    <DatePicker
                      value={formData.admissionDate}
                      onChange={(date) =>
                        setFormData({ ...formData, admissionDate: date })
                      }
                      disabled={isLoading}
                      placeholder="Select date"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alternateEmail" className="text-sm">
                    Alternate Email
                  </Label>
                  <Input
                    id="alternateEmail"
                    type="email"
                    placeholder="alternate@example.com"
                    value={formData.alternateEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alternateEmail: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryMobile" className="text-sm">
                      Primary Mobile
                    </Label>
                    <Input
                      id="primaryMobile"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.primaryMobile}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryMobile: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alternateMobile" className="text-sm">
                      Alternate Mobile
                    </Label>
                    <Input
                      id="alternateMobile"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.alternateMobile}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alternateMobile: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="presentAddressLine1" className="text-sm">
                    Address Line 1
                  </Label>
                  <Input
                    id="presentAddressLine1"
                    placeholder="Street address, building name"
                    value={formData.presentAddressLine1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        presentAddressLine1: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="presentAddressLine2" className="text-sm">
                    Address Line 2
                  </Label>
                  <Input
                    id="presentAddressLine2"
                    placeholder="Apartment, suite, unit (optional)"
                    value={formData.presentAddressLine2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        presentAddressLine2: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="presentCity" className="text-sm">
                      City / District
                    </Label>
                    <Input
                      id="presentCity"
                      placeholder="City name"
                      value={formData.presentCity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presentCity: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presentState" className="text-sm">
                      State
                    </Label>
                    <Input
                      id="presentState"
                      placeholder="State name"
                      value={formData.presentState}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presentState: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="presentCountry" className="text-sm">
                      Country
                    </Label>
                    <Input
                      id="presentCountry"
                      placeholder="Country name"
                      value={formData.presentCountry}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presentCountry: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presentPostalCode" className="text-sm">
                      Postal Code
                    </Label>
                    <Input
                      id="presentPostalCode"
                      placeholder="PIN / ZIP code"
                      value={formData.presentPostalCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presentPostalCode: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
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
                    {isEdit ? "Update Profile" : "Create Profile"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
