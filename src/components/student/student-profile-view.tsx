"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  GraduationCap,
  MapPin,
  Calendar,
  Edit,
} from "lucide-react";
import { RequestUpdateDialog } from "./request-update-dialog";

interface ProfileData {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
    departmentId?: {
      _id: string;
      name: string;
      code: string;
    };
    classId?: {
      _id: string;
      name: string;
      academicYear: string;
    };
    isActive: boolean;
    createdAt: string;
  };
  profile: {
    studentId: string;
    enrollmentNumber?: string;
    middleName?: string;
    fatherName?: string;
    motherName?: string;
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    alternateEmail?: string;
    primaryMobile?: string;
    alternateMobile?: string;
    courseId?: {
      _id: string;
      name: string;
      code: string;
      courseType: string;
    };
    batch?: string;
    academicSession?: string;
    rollNumber?: string;
    admissionDate?: string;
    studentStatus: string;
    presentAddressLine1?: string;
    presentAddressLine2?: string;
    presentCity?: string;
    presentState?: string;
    presentCountry?: string;
    presentPostalCode?: string;
  } | null;
  semester: {
    name: string;
    number: number;
  } | null;
}

interface StudentProfileViewProps {
  data: ProfileData;
}

const statusColors: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  regular: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  detained: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  alumni: "border-violet-500/30 bg-violet-500/10 text-violet-600",
};

const statusDotColors: Record<string, string> = {
  active: "bg-emerald-500",
  regular: "bg-blue-500",
  detained: "bg-rose-500",
  alumni: "bg-violet-500",
};

const genderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

const courseTypeLabels: Record<string, string> = {
  diploma: "Diploma",
  ug: "Undergraduate",
  pg: "Postgraduate",
};

function formatDate(dateString?: string) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function StudentProfileView({ data }: StudentProfileViewProps) {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const { user, profile, semester } = data;

  const fullName = [user.firstName, profile?.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar className="border-primary/10 h-20 w-20 border-4">
              <AvatarImage src={user.profileImage} alt={fullName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{fullName}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile && (
                  <>
                    <Badge
                      variant="outline"
                      className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                    >
                      {profile.studentId}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={statusColors[profile.studentStatus]}
                    >
                      <span
                        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusDotColors[profile.studentStatus]}`}
                      />
                      {profile.studentStatus.charAt(0).toUpperCase() +
                        profile.studentStatus.slice(1)}
                    </Badge>
                  </>
                )}
                {!user.isActive && (
                  <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-500/10 text-rose-600"
                  >
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={() => setShowRequestDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Request Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Identity Information */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Identity Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <ProfileField label="Student ID" value={profile?.studentId} />
            <ProfileField
              label="Enrollment Number"
              value={profile?.enrollmentNumber}
            />
            <ProfileField label="Full Name" value={fullName} />
            <ProfileField label="Father's Name" value={profile?.fatherName} />
            <ProfileField label="Mother's Name" value={profile?.motherName} />
            <Separator />
            <ProfileField
              label="Gender"
              value={profile?.gender ? genderLabels[profile.gender] : undefined}
            />
            <ProfileField
              label="Date of Birth"
              value={formatDate(profile?.dateOfBirth)}
            />
            <ProfileField label="Blood Group" value={profile?.bloodGroup} />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Mail className="h-4 w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <ProfileField label="Primary Email" value={user.email} />
            <ProfileField
              label="Alternate Email"
              value={profile?.alternateEmail}
            />
            <Separator />
            <ProfileField
              label="Primary Mobile"
              value={profile?.primaryMobile}
            />
            <ProfileField
              label="Alternate Mobile"
              value={profile?.alternateMobile}
            />
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <GraduationCap className="h-4 w-4 text-violet-600" />
              </div>
              <CardTitle className="text-lg">Academic Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <ProfileField
              label="Department"
              value={
                user.departmentId
                  ? `${user.departmentId.name} (${user.departmentId.code})`
                  : undefined
              }
            />
            <ProfileField
              label="Course"
              value={
                profile?.courseId
                  ? `${profile.courseId.name} (${profile.courseId.code})`
                  : undefined
              }
            />
            <ProfileField
              label="Program Type"
              value={
                profile?.courseId?.courseType
                  ? courseTypeLabels[profile.courseId.courseType]
                  : undefined
              }
            />
            <Separator />
            <ProfileField label="Batch" value={profile?.batch} />
            <ProfileField
              label="Academic Session"
              value={profile?.academicSession}
            />
            <ProfileField
              label="Semester"
              value={
                semester
                  ? `${semester.name} (Sem ${semester.number})`
                  : undefined
              }
            />
            <ProfileField
              label="Class / Section"
              value={
                user.classId
                  ? `${user.classId.name} (${user.classId.academicYear})`
                  : undefined
              }
            />
            <ProfileField label="Roll Number" value={profile?.rollNumber} />
            <Separator />
            <ProfileField
              label="Admission Date"
              value={formatDate(profile?.admissionDate)}
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <MapPin className="h-4 w-4 text-amber-600" />
              </div>
              <CardTitle className="text-lg">Address</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <ProfileField
              label="Address Line 1"
              value={profile?.presentAddressLine1}
            />
            <ProfileField
              label="Address Line 2"
              value={profile?.presentAddressLine2}
            />
            <ProfileField
              label="City / District"
              value={profile?.presentCity}
            />
            <ProfileField label="State" value={profile?.presentState} />
            <ProfileField label="Country" value={profile?.presentCountry} />
            <ProfileField
              label="Postal Code"
              value={profile?.presentPostalCode}
            />
          </CardContent>
        </Card>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Calendar className="text-primary h-4 w-4" />
            </div>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField
              label="Account Created"
              value={formatDate(user.createdAt)}
            />
            <ProfileField
              label="Account Status"
              value={user.isActive ? "Active" : "Inactive"}
            />
          </div>
        </CardContent>
      </Card>

      <RequestUpdateDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        currentProfile={{
          firstName: user.firstName || "",
          middleName: profile?.middleName || "",
          lastName: user.lastName || "",
          fatherName: profile?.fatherName || "",
          motherName: profile?.motherName || "",
          gender: profile?.gender || "",
          dateOfBirth: profile?.dateOfBirth
            ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
            : "",
          bloodGroup: profile?.bloodGroup || "",
          email: user.email || "",
          alternateEmail: profile?.alternateEmail || "",
          primaryMobile: profile?.primaryMobile || "",
          alternateMobile: profile?.alternateMobile || "",
          presentAddressLine1: profile?.presentAddressLine1 || "",
          presentAddressLine2: profile?.presentAddressLine2 || "",
          presentCity: profile?.presentCity || "",
          presentState: profile?.presentState || "",
          presentCountry: profile?.presentCountry || "",
          presentPostalCode: profile?.presentPostalCode || "",
        }}
      />
    </div>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-right text-sm font-medium">
        {value || <span className="text-muted-foreground">-</span>}
      </span>
    </div>
  );
}
