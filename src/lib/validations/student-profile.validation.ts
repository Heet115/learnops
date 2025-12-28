import { z } from "zod";

export const genderEnum = z.enum(["male", "female", "other"]);
export const bloodGroupEnum = z.enum([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);
export const studentStatusEnum = z.enum([
  "active",
  "regular",
  "detained",
  "alumni",
]);

// Admin creates/updates student profile
export const createStudentProfileSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  studentId: z.string().min(1, "Student ID is required").max(50),
  enrollmentNumber: z.string().max(50).optional(),
  middleName: z.string().max(50).optional(),
  fatherName: z.string().max(100).optional(),
  motherName: z.string().max(100).optional(),
  gender: genderEnum.optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: bloodGroupEnum.optional(),
  alternateEmail: z.string().email().optional().or(z.literal("")),
  primaryMobile: z.string().max(20).optional(),
  alternateMobile: z.string().max(20).optional(),
  courseId: z.string().optional(),
  batch: z.string().max(20).optional(),
  academicSession: z.string().max(20).optional(),
  rollNumber: z.string().max(20).optional(),
  admissionDate: z.string().optional(),
  studentStatus: studentStatusEnum.default("active"),
  presentAddressLine1: z.string().max(200).optional(),
  presentAddressLine2: z.string().max(200).optional(),
  presentCity: z.string().max(100).optional(),
  presentState: z.string().max(100).optional(),
  presentCountry: z.string().max(100).optional(),
  presentPostalCode: z.string().max(20).optional(),
});

export const updateStudentProfileSchema = createStudentProfileSchema
  .omit({ userId: true, studentId: true })
  .partial();

// Profile update request (student submits)
export const requestedChangeSchema = z.object({
  fieldKey: z.string().min(1),
  fieldLabel: z.string().min(1),
  currentValue: z.string().nullable(),
  requestedValue: z.string().min(1),
});

export const createProfileUpdateRequestSchema = z.object({
  requestedChanges: z
    .array(requestedChangeSchema)
    .min(1, "At least one change is required"),
});

// Admin reviews request
export const reviewProfileUpdateRequestSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  reviewComment: z.string().max(500).optional(),
});

// Allowed fields for student update requests
export const allowedUpdateFields = [
  // Identity
  "firstName",
  "middleName",
  "lastName",
  "fatherName",
  "motherName",
  "gender",
  "dateOfBirth",
  "bloodGroup",
  // Contact
  "email",
  "alternateEmail",
  "primaryMobile",
  "alternateMobile",
  // Address
  "presentAddressLine1",
  "presentAddressLine2",
  "presentCity",
  "presentState",
  "presentCountry",
  "presentPostalCode",
] as const;

export type CreateStudentProfileInput = z.infer<
  typeof createStudentProfileSchema
>;
export type UpdateStudentProfileInput = z.infer<
  typeof updateStudentProfileSchema
>;
export type RequestedChangeInput = z.infer<typeof requestedChangeSchema>;
export type CreateProfileUpdateRequestInput = z.infer<
  typeof createProfileUpdateRequestSchema
>;
export type ReviewProfileUpdateRequestInput = z.infer<
  typeof reviewProfileUpdateRequestSchema
>;
