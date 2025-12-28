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
import {
  createStudentProfile,
  updateStudentProfile,
  getStudentProfile,
} from "@/lib/actions/student-profile.actions";
import { Loader2 } from "lucide-react";
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
  { value: "active", label: "Active" },
  { value: "regular", label: "Regular" },
  { value: "detained", label: "Detained" },
  { value: "alumni", label: "Alumni" },
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
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    studentId: "",
    enrollmentNumber: "",
    middleName: "",
    fatherName: "",
    motherName: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    alternateEmail: "",
    primaryMobile: "",
    alternateMobile: "",
    courseId: "",
    batch: "",
    academicSession: "",
    rollNumber: "",
    admissionDate: "",
    studentStatus: "active",
    presentAddressLine1: "",
    presentAddressLine2: "",
    presentCity: "",
    presentState: "",
    presentCountry: "",
    presentPostalCode: "",
  });

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    setIsFetching(true);
    const profile = await getStudentProfile(userId);

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
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        bloodGroup: profile.bloodGroup || "",
        alternateEmail: profile.alternateEmail || "",
        primaryMobile: profile.primaryMobile || "",
        alternateMobile: profile.alternateMobile || "",
        courseId: profile.courseId?._id || profile.courseId || "",
        batch: profile.batch || "",
        academicSession: profile.academicSession || "",
        rollNumber: profile.rollNumber || "",
        admissionDate: profile.admissionDate
          ? new Date(profile.admissionDate).toISOString().split("T")[0]
          : "",
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.studentId.trim()) {
      setError("Student ID is required");
      setIsLoading(false);
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
      dateOfBirth: formData.dateOfBirth || undefined,
      admissionDate: formData.admissionDate || undefined,
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit" : "Create"} Student Profile
          </DialogTitle>
          <DialogDescription>{userName}</DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID *</Label>
                    <Input
                      id="studentId"
                      value={formData.studentId}
                      onChange={(e) =>
                        setFormData({ ...formData, studentId: e.target.value })
                      }
                      disabled={isLoading || isEdit}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
                    <Input
                      id="enrollmentNumber"
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
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) =>
                      setFormData({ ...formData, middleName: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name</Label>
                    <Input
                      id="fatherName"
                      value={formData.fatherName}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherName: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother's Name</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={(e) =>
                        setFormData({ ...formData, motherName: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
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
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseId">Course</Label>
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
                    <Label htmlFor="studentStatus">Status</Label>
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
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch</Label>
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
                    <Label htmlFor="academicSession">Academic Session</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      value={formData.rollNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, rollNumber: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admissionDate">Admission Date</Label>
                    <Input
                      id="admissionDate"
                      type="date"
                      value={formData.admissionDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admissionDate: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alternateEmail">Alternate Email</Label>
                  <Input
                    id="alternateEmail"
                    type="email"
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryMobile">Primary Mobile</Label>
                    <Input
                      id="primaryMobile"
                      type="tel"
                      placeholder="e.g., +91 9876543210"
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
                    <Label htmlFor="alternateMobile">Alternate Mobile</Label>
                    <Input
                      id="alternateMobile"
                      type="tel"
                      placeholder="e.g., +91 9876543210"
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
                  <Label htmlFor="presentAddressLine1">Address Line 1</Label>
                  <Input
                    id="presentAddressLine1"
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
                  <Label htmlFor="presentAddressLine2">Address Line 2</Label>
                  <Input
                    id="presentAddressLine2"
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="presentCity">City / District</Label>
                    <Input
                      id="presentCity"
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
                    <Label htmlFor="presentState">State</Label>
                    <Input
                      id="presentState"
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="presentCountry">Country</Label>
                    <Input
                      id="presentCountry"
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
                    <Label htmlFor="presentPostalCode">Postal Code</Label>
                    <Input
                      id="presentPostalCode"
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

            <DialogFooter className="mt-6">
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
                ) : isEdit ? (
                  "Update Profile"
                ) : (
                  "Create Profile"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
