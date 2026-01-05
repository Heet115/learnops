import { z } from "zod";

// CSV column mapping
export const CSV_COLUMNS = {
  fullName: "Full Name",
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  gender: "Gender",
  dateOfBirth: "Date of Birth",
  bloodGroup: "Blood Group",
  primaryEmail: "Primary Email",
  alternateEmail: "Alternate Email",
  primaryMobile: "Primary Mobile",
  alternateMobile: "Alternate Mobile",
  batch: "Batch",
  academicSession: "Academic Session",
  admissionDate: "Admission Date",
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2",
  city: "City / District",
  state: "State",
  country: "Country",
  postalCode: "Postal Code",
} as const;

export const bulkStudentRowSchema = z.object({
  // Required for account creation
  email: z.email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  classId: z.string().min(1, "Class is required"),

  // Profile fields (optional)
  fatherName: z.string().max(100).optional(),
  motherName: z.string().max(100).optional(),
  gender: z.string().optional(), // Will be normalized in action
  dateOfBirth: z.string().optional(), // Will be parsed to Date
  bloodGroup: z.string().optional(), // Will be normalized in action
  alternateEmail: z.string().email().optional().or(z.literal("")),
  primaryMobile: z.string().max(20).optional(),
  alternateMobile: z.string().max(20).optional(),
  batch: z.string().max(20).optional(),
  academicSession: z.string().max(20).optional(),
  admissionDate: z.string().optional(), // Will be parsed to Date
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
});

export const bulkStudentImportSchema = z.object({
  students: z
    .array(bulkStudentRowSchema)
    .min(1, "At least one student required"),
  generatePasswords: z.boolean().default(true),
});

export type BulkStudentRow = z.infer<typeof bulkStudentRowSchema>;
export type BulkStudentImportInput = z.infer<typeof bulkStudentImportSchema>;

// Parsed row from CSV (before validation)
export interface ParsedStudentRow {
  rowNumber: number;
  // Account fields
  email: string;
  firstName: string;
  lastName: string;
  className?: string;
  classId?: string;
  // Profile fields
  fatherName?: string;
  motherName?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  alternateEmail?: string;
  primaryMobile?: string;
  alternateMobile?: string;
  batch?: string;
  academicSession?: string;
  admissionDate?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  // Validation
  errors: string[];
  isValid: boolean;
}

// Result of bulk import
export interface BulkImportResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  results: {
    email: string;
    studentId?: string;
    success: boolean;
    error?: string;
    tempPassword?: string;
  }[];
}
