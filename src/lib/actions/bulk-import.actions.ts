"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB, User, Class, StudentProfile } from "@/lib/db";
import {
  bulkStudentImportSchema,
  BulkStudentImportInput,
  BulkImportResult,
  ParsedStudentRow,
} from "@/lib/validations/bulk-import.validation";
import { revalidatePath } from "next/cache";

// Generate a secure random password
function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate unique student ID
async function generateStudentId(prefix = "STU"): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await StudentProfile.countDocuments();
  const sequence = (count + 1).toString().padStart(5, "0");
  return `${prefix}${year}${sequence}`;
}

// Parse date string to Date object
function parseDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  // Try common formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[2]) {
        // YYYY-MM-DD
        return new Date(
          parseInt(match[1]),
          parseInt(match[2]) - 1,
          parseInt(match[3]),
        );
      } else {
        // DD/MM/YYYY or DD-MM-YYYY
        return new Date(
          parseInt(match[3]),
          parseInt(match[2]) - 1,
          parseInt(match[1]),
        );
      }
    }
  }
  // Try native parsing as fallback
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

// Normalize gender value
function normalizeGender(
  gender?: string,
): "male" | "female" | "other" | undefined {
  if (!gender) return undefined;
  const g = gender.toLowerCase().trim();
  if (g === "m" || g === "male") return "male";
  if (g === "f" || g === "female") return "female";
  if (g === "o" || g === "other") return "other";
  return undefined;
}

// Normalize blood group
type BloodGroupType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
function normalizeBloodGroup(bg?: string): BloodGroupType | undefined {
  if (!bg) return undefined;
  const normalized = bg.toUpperCase().trim().replace(/\s/g, "");
  const valid: BloodGroupType[] = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
  ];
  return valid.includes(normalized as BloodGroupType)
    ? (normalized as BloodGroupType)
    : undefined;
}

async function requireAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

// Validate parsed rows against existing data
export async function validateBulkStudentData(
  rows: ParsedStudentRow[],
): Promise<ParsedStudentRow[]> {
  await requireAdmin();
  await connectDB();

  // Get all existing emails
  const existingUsers = await User.find({
    email: { $in: rows.map((r) => r.email.toLowerCase()) },
  }).select("email");
  const existingEmails = new Set(
    existingUsers.map((u) => u.email.toLowerCase()),
  );

  // Get all valid class IDs
  const classes = await Class.find({ isActive: true }).select("_id name");
  const classMap = new Map(classes.map((c) => [c._id.toString(), c.name]));

  // Check for duplicate emails within the batch
  const emailCounts = new Map<string, number>();
  rows.forEach((row) => {
    const email = row.email.toLowerCase();
    emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
  });

  return rows.map((row) => {
    const errors: string[] = [];
    const email = row.email.toLowerCase();

    // Check email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format");
    }

    // Check for existing email
    if (existingEmails.has(email)) {
      errors.push("Email already exists in system");
    }

    // Check for duplicate in batch
    if ((emailCounts.get(email) || 0) > 1) {
      errors.push("Duplicate email in import file");
    }

    // Check names
    if (!row.firstName?.trim()) {
      errors.push("First name is required");
    }
    if (!row.lastName?.trim()) {
      errors.push("Last name is required");
    }

    // Check class
    if (!row.classId || !classMap.has(row.classId)) {
      errors.push("Invalid or missing class");
    }

    // Validate optional fields
    if (
      row.alternateEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.alternateEmail)
    ) {
      errors.push("Invalid alternate email format");
    }

    if (row.gender && !normalizeGender(row.gender)) {
      errors.push("Invalid gender (use Male/Female/Other)");
    }

    if (row.bloodGroup && !normalizeBloodGroup(row.bloodGroup)) {
      errors.push("Invalid blood group");
    }

    return {
      ...row,
      className: row.classId ? classMap.get(row.classId) : undefined,
      errors,
      isValid: errors.length === 0,
    };
  });
}

// Bulk create students
export async function bulkCreateStudents(
  input: BulkStudentImportInput,
): Promise<BulkImportResult> {
  await requireAdmin();

  const validated = bulkStudentImportSchema.parse(input);
  const clerk = await clerkClient();
  await connectDB();

  const results: BulkImportResult["results"] = [];
  let successCount = 0;
  let failedCount = 0;

  // Process students one by one to handle partial failures
  for (const student of validated.students) {
    const tempPassword = generatePassword();

    try {
      // Check if email already exists
      const existingUser = await User.findOne({
        email: student.email.toLowerCase(),
      });
      if (existingUser) {
        results.push({
          email: student.email,
          success: false,
          error: "Email already exists",
        });
        failedCount++;
        continue;
      }

      // Create user in Clerk
      const clerkUser = await clerk.users.createUser({
        emailAddress: [student.email],
        firstName: student.firstName,
        lastName: student.lastName,
        password: tempPassword,
        publicMetadata: {
          role: "student",
        },
      });

      // Get class to find department and course
      const classDoc = await Class.findById(student.classId).populate({
        path: "semesterId",
        populate: {
          path: "courseId",
          select: "departmentId _id",
        },
      });

      const semesterData = classDoc?.semesterId as {
        courseId?: { departmentId?: string; _id?: string };
      };
      const departmentId = semesterData?.courseId?.departmentId;
      const courseId = semesterData?.courseId?._id;

      // Create user in MongoDB
      const newUser = await User.create({
        clerkId: clerkUser.id,
        email: student.email.toLowerCase(),
        firstName: student.firstName,
        lastName: student.lastName,
        role: "student",
        classId: student.classId,
        departmentId: departmentId || undefined,
        profileImage: clerkUser.imageUrl,
        isActive: true,
      });

      // Generate student ID and create profile
      const studentId = await generateStudentId();

      await StudentProfile.create({
        userId: newUser._id,
        studentId,
        fatherName: student.fatherName || undefined,
        motherName: student.motherName || undefined,
        gender: normalizeGender(student.gender),
        dateOfBirth: parseDate(student.dateOfBirth),
        bloodGroup: normalizeBloodGroup(student.bloodGroup),
        alternateEmail: student.alternateEmail || undefined,
        primaryMobile: student.primaryMobile || undefined,
        alternateMobile: student.alternateMobile || undefined,
        courseId: courseId || undefined,
        batch: student.batch || undefined,
        academicSession: student.academicSession || undefined,
        admissionDate: parseDate(student.admissionDate),
        studentStatus: "active",
        presentAddressLine1: student.addressLine1 || undefined,
        presentAddressLine2: student.addressLine2 || undefined,
        presentCity: student.city || undefined,
        presentState: student.state || undefined,
        presentCountry: student.country || undefined,
        presentPostalCode: student.postalCode || undefined,
      });

      results.push({
        email: student.email,
        studentId,
        success: true,
        tempPassword,
      });
      successCount++;
    } catch (error: unknown) {
      console.error(`Error creating student ${student.email}:`, error);
      const clerkError = error as { errors?: { message: string }[] };
      results.push({
        email: student.email,
        success: false,
        error: clerkError.errors?.[0]?.message || "Failed to create user",
      });
      failedCount++;
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/student-assignments");

  return {
    success: failedCount === 0,
    totalProcessed: validated.students.length,
    successCount,
    failedCount,
    results,
  };
}

// Get classes with full hierarchy for dropdown
export async function getClassesForBulkImport() {
  await requireAdmin();
  await connectDB();

  const classes = await Class.find({ isActive: true })
    .populate({
      path: "semesterId",
      select: "name number courseId",
      populate: {
        path: "courseId",
        select: "name code departmentId",
        populate: { path: "departmentId", select: "name code" },
      },
    })
    .sort({ name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(classes));
}
