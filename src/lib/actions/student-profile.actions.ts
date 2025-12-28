"use server";

import { auth } from "@clerk/nextjs/server";
import {
  connectDB,
  User,
  StudentProfile,
  ProfileUpdateRequest,
  Course,
  Semester,
  Class,
  Department,
} from "@/lib/db";
import {
  createStudentProfileSchema,
  updateStudentProfileSchema,
  createProfileUpdateRequestSchema,
  reviewProfileUpdateRequestSchema,
  allowedUpdateFields,
  CreateStudentProfileInput,
  UpdateStudentProfileInput,
  CreateProfileUpdateRequestInput,
  ReviewProfileUpdateRequestInput,
} from "@/lib/validations/student-profile.validation";
import { createNotification } from "./notification.actions";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

async function getCurrentUser() {
  const { sessionClaims } = await auth();
  const clerkId = sessionClaims?.sub;
  if (!clerkId) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findOne({ clerkId });
  if (!user) throw new Error("User not found");

  return user;
}

// ==================== ADMIN: STUDENT PROFILE CRUD ====================

export async function createStudentProfile(input: CreateStudentProfileInput) {
  await requireAdmin();
  const validated = createStudentProfileSchema.parse(input);
  await connectDB();

  // Verify user exists and is a student
  const user = await User.findById(validated.userId);
  if (!user) return { success: false, error: "User not found" };
  if (user.role !== "student") {
    return { success: false, error: "User is not a student" };
  }

  // Check if profile already exists
  const existing = await StudentProfile.findOne({ userId: validated.userId });
  if (existing) {
    return { success: false, error: "Student profile already exists" };
  }

  try {
    const profile = await StudentProfile.create({
      ...validated,
      dateOfBirth: validated.dateOfBirth
        ? new Date(validated.dateOfBirth)
        : undefined,
      admissionDate: validated.admissionDate
        ? new Date(validated.admissionDate)
        : undefined,
    });

    revalidatePath("/admin/users");
    return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return { success: false, error: "Student ID already exists" };
    }
    return { success: false, error: "Failed to create student profile" };
  }
}

export async function updateStudentProfile(
  userId: string,
  input: UpdateStudentProfileInput,
) {
  await requireAdmin();
  const validated = updateStudentProfileSchema.parse(input);
  await connectDB();

  const updateData: Record<string, unknown> = { ...validated };
  if (validated.dateOfBirth) {
    updateData.dateOfBirth = new Date(validated.dateOfBirth);
  }
  if (validated.admissionDate) {
    updateData.admissionDate = new Date(validated.admissionDate);
  }

  try {
    const profile = await StudentProfile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true },
    );

    if (!profile) {
      return { success: false, error: "Student profile not found" };
    }

    revalidatePath("/admin/users");
    return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
  } catch (error) {
    console.error("Error updating student profile:", error);
    return { success: false, error: "Failed to update student profile" };
  }
}

export async function getStudentProfile(userId: string) {
  await connectDB();
  const profile = await StudentProfile.findOne({ userId })
    .populate("courseId", "name code courseType")
    .lean();
  return profile ? JSON.parse(JSON.stringify(profile)) : null;
}

export async function getStudentFullProfile(userId: string) {
  await connectDB();

  const user = await User.findById(userId)
    .populate("departmentId", "name code")
    .populate("classId", "name academicYear semesterId")
    .lean();

  if (!user) return null;

  const profile = await StudentProfile.findOne({ userId })
    .populate("courseId", "name code courseType")
    .lean();

  // Get semester info if class exists
  let semesterInfo = null;
  if (user.classId) {
    const classDoc = user.classId as unknown as { semesterId?: string };
    if (classDoc.semesterId) {
      semesterInfo = await Semester.findById(classDoc.semesterId)
        .select("name number")
        .lean();
    }
  }

  return JSON.parse(
    JSON.stringify({
      user,
      profile,
      semester: semesterInfo,
    }),
  );
}

// ==================== STUDENT: VIEW OWN PROFILE ====================

export async function getMyProfile() {
  const currentUser = await getCurrentUser();

  if (currentUser.role !== "student") {
    return { success: false, error: "Only students have profiles" };
  }

  const fullProfile = await getStudentFullProfile(
    currentUser._id as unknown as string,
  );

  return { success: true, data: fullProfile };
}

// ==================== STUDENT: PROFILE UPDATE REQUESTS ====================

export async function createProfileUpdateRequest(
  input: CreateProfileUpdateRequestInput,
) {
  const currentUser = await getCurrentUser();

  if (currentUser.role !== "student") {
    return {
      success: false,
      error: "Only students can request profile updates",
    };
  }

  const validated = createProfileUpdateRequestSchema.parse(input);

  // Validate that only allowed fields are being requested
  for (const change of validated.requestedChanges) {
    if (
      !allowedUpdateFields.includes(
        change.fieldKey as (typeof allowedUpdateFields)[number],
      )
    ) {
      return {
        success: false,
        error: `Field "${change.fieldLabel}" cannot be updated by students`,
      };
    }
  }

  // Check for pending requests
  await connectDB();
  const pendingRequest = await ProfileUpdateRequest.findOne({
    requestedBy: currentUser._id,
    requestStatus: "pending",
  });

  if (pendingRequest) {
    return {
      success: false,
      error: "You already have a pending update request",
    };
  }

  try {
    const request = await ProfileUpdateRequest.create({
      requestedBy: currentUser._id,
      requestedChanges: validated.requestedChanges,
      requestedAt: new Date(),
    });

    // Notify admins
    const admins = await User.find({ role: "admin", isActive: true }).select(
      "_id",
    );
    for (const admin of admins) {
      await createNotification({
        userId: (admin._id as unknown as { toString(): string }).toString(),
        type: "system",
        title: "Profile Update Request",
        message: `${currentUser.firstName} ${currentUser.lastName} has requested a profile update`,
        relatedId: (
          request._id as unknown as { toString(): string }
        ).toString(),
      });
    }

    revalidatePath("/student/profile");
    return { success: true, request: JSON.parse(JSON.stringify(request)) };
  } catch (error) {
    console.error("Error creating profile update request:", error);
    return { success: false, error: "Failed to create update request" };
  }
}

export async function getMyUpdateRequests() {
  const currentUser = await getCurrentUser();

  await connectDB();
  const requests = await ProfileUpdateRequest.find({
    requestedBy: currentUser._id,
  })
    .populate("reviewedBy", "firstName lastName")
    .sort({ requestedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(requests));
}

// ==================== ADMIN: REVIEW UPDATE REQUESTS ====================

export async function getAllUpdateRequests(status?: string) {
  await requireAdmin();
  await connectDB();

  const query: Record<string, unknown> = {};
  if (status && status !== "all") {
    query.requestStatus = status;
  }

  const requests = await ProfileUpdateRequest.find(query)
    .populate("requestedBy", "firstName lastName email")
    .populate("reviewedBy", "firstName lastName")
    .sort({ requestedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(requests));
}

export async function reviewProfileUpdateRequest(
  input: ReviewProfileUpdateRequestInput,
) {
  await requireAdmin();
  const validated = reviewProfileUpdateRequestSchema.parse(input);
  await connectDB();

  const { sessionClaims } = await auth();
  const clerkId = sessionClaims?.sub;
  const adminUser = await User.findOne({ clerkId });

  const request = await ProfileUpdateRequest.findById(validated.requestId);
  if (!request) {
    return { success: false, error: "Request not found" };
  }

  if (request.requestStatus !== "pending") {
    return { success: false, error: "Request has already been reviewed" };
  }

  try {
    if (validated.action === "approve") {
      // Apply the changes to student profile
      const updateData: Record<string, string> = {};
      for (const change of request.requestedChanges) {
        if (
          allowedUpdateFields.includes(
            change.fieldKey as (typeof allowedUpdateFields)[number],
          )
        ) {
          updateData[change.fieldKey] = change.requestedValue;
        }
      }

      await StudentProfile.findOneAndUpdate(
        { userId: request.requestedBy },
        updateData,
      );
    }

    // Update request status
    request.requestStatus =
      validated.action === "approve" ? "approved" : "rejected";
    request.reviewedBy = adminUser?._id as mongoose.Types.ObjectId;
    request.reviewComment = validated.reviewComment;
    request.reviewedAt = new Date();
    await request.save();

    // Notify student
    await createNotification({
      userId: (
        request.requestedBy as unknown as { toString(): string }
      ).toString(),
      type: "system",
      title: `Profile Update ${validated.action === "approve" ? "Approved" : "Rejected"}`,
      message:
        validated.action === "approve"
          ? "Your profile update request has been approved"
          : `Your profile update request was rejected${validated.reviewComment ? `: ${validated.reviewComment}` : ""}`,
      relatedId: validated.requestId,
    });

    revalidatePath("/admin/profile-requests");
    return { success: true };
  } catch (error) {
    console.error("Error reviewing profile update request:", error);
    return { success: false, error: "Failed to review request" };
  }
}

// Import mongoose for ObjectId type
import mongoose from "mongoose";
