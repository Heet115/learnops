"use server";

import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import {
  connectDB,
  User,
  Announcement,
  Department,
  Course,
  Class,
} from "@/lib/db";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "@/lib/validations/announcement.validation";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity.actions";

// Helper to check if user can create announcements (admin, hod, professor)
async function requireAnnouncementCreator() {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!role || !["admin", "hod", "professor"].includes(role)) {
    throw new Error("Unauthorized: Only admin, HOD, or professor can create announcements");
  }
  return { clerkId: userId, role };
}

async function getUserDbId(clerkId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true });
  if (!user) throw new Error("User not found");
  return { id: user._id.toString(), user };
}

// Create announcement
export async function createAnnouncement(input: CreateAnnouncementInput) {
  const { clerkId, role } = await requireAnnouncementCreator();
  const validated = createAnnouncementSchema.parse(input);
  const { id: userId } = await getUserDbId(clerkId!);

  // Validate target based on role
  if (role === "professor") {
    // Professors can only target their classes
    if (validated.target.type === "all" || validated.target.type === "department") {
      return { success: false, error: "Professors can only create announcements for their classes" };
    }
  }

  if (role === "hod") {
    // HODs can target their department or classes within it
    if (validated.target.type === "all") {
      return { success: false, error: "HODs can only create announcements for their department" };
    }
  }

  try {
    const announcementData: Record<string, unknown> = {
      title: validated.title,
      content: validated.content,
      createdBy: userId,
      target: {
        type: validated.target.type,
        id: validated.target.id ? new mongoose.Types.ObjectId(validated.target.id) : undefined,
        role: validated.target.role,
      },
      priority: validated.priority,
      isPinned: validated.isPinned,
    };

    if (validated.expiresAt) {
      announcementData.expiresAt = new Date(validated.expiresAt);
    }

    const announcement = await Announcement.create(announcementData);

    await logActivity({
      action: "ala_created", // Reusing action type
      entityType: "ala", // Could add "announcement" to activity types
      entityId: announcement._id.toString(),
      details: {
        type: "announcement",
        title: validated.title,
        target: validated.target,
      },
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/hod/announcements");
    revalidatePath("/professor/announcements");
    return { success: true, announcement: JSON.parse(JSON.stringify(announcement)) };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Failed to create announcement" };
  }
}

// Get announcements for current user
export async function getAnnouncementsForUser() {
  const { sessionClaims, userId } = await auth();
  if (!userId) return [];

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return [];

  const now = new Date();
  const query: Record<string, unknown> = {
    isActive: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  };

  // Build target conditions based on user role and assignments
  const targetConditions: Record<string, unknown>[] = [
    { "target.type": "all" },
    { "target.type": "role", "target.role": role },
  ];

  if (user.departmentId) {
    targetConditions.push({ "target.type": "department", "target.id": user.departmentId });
  }

  if (user.classId) {
    targetConditions.push({ "target.type": "class", "target.id": user.classId });
    
    // Get course from class
    const classDoc = await Class.findById(user.classId).populate({
      path: "semesterId",
      select: "courseId",
    });
    if (classDoc?.semesterId) {
      const semester = classDoc.semesterId as unknown as { courseId: mongoose.Types.ObjectId };
      targetConditions.push({ "target.type": "course", "target.id": semester.courseId });
    }
  }

  query.$or = [{ $or: targetConditions }];

  const announcements = await Announcement.find(query)
    .populate("createdBy", "firstName lastName role")
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(50)
    .lean();

  return JSON.parse(JSON.stringify(announcements));
}

// Get all announcements (admin only)
export async function getAllAnnouncements() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");

  await connectDB();
  const announcements = await Announcement.find()
    .populate("createdBy", "firstName lastName role")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(announcements));
}

// Get announcements created by current user (for professors/HODs)
export async function getMyAnnouncements() {
  const { clerkId } = await requireAnnouncementCreator();
  const { id: userId } = await getUserDbId(clerkId!);

  const announcements = await Announcement.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(announcements));
}

// Update announcement
export async function updateAnnouncement(id: string, input: UpdateAnnouncementInput) {
  const { clerkId, role } = await requireAnnouncementCreator();
  const validated = updateAnnouncementSchema.parse(input);
  const { id: userId } = await getUserDbId(clerkId!);

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return { success: false, error: "Announcement not found" };
  }

  // Only creator or admin can update
  if (announcement.createdBy.toString() !== userId && role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updateData: Record<string, unknown> = { ...validated };
    if (validated.expiresAt) {
      updateData.expiresAt = new Date(validated.expiresAt);
    } else if (validated.expiresAt === null) {
      updateData.$unset = { expiresAt: 1 };
      delete updateData.expiresAt;
    }
    if (validated.target?.id) {
      updateData.target = {
        ...validated.target,
        id: new mongoose.Types.ObjectId(validated.target.id),
      };
    }

    const updated = await Announcement.findByIdAndUpdate(id, updateData, { new: true });

    revalidatePath("/admin/announcements");
    revalidatePath("/hod/announcements");
    revalidatePath("/professor/announcements");
    return { success: true, announcement: JSON.parse(JSON.stringify(updated)) };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: "Failed to update announcement" };
  }
}

// Delete announcement
export async function deleteAnnouncement(id: string) {
  const { clerkId, role } = await requireAnnouncementCreator();
  const { id: userId } = await getUserDbId(clerkId!);

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return { success: false, error: "Announcement not found" };
  }

  // Only creator or admin can delete
  if (announcement.createdBy.toString() !== userId && role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  await Announcement.findByIdAndDelete(id);

  revalidatePath("/admin/announcements");
  revalidatePath("/hod/announcements");
  revalidatePath("/professor/announcements");
  return { success: true };
}

// Toggle pin status
export async function toggleAnnouncementPin(id: string) {
  const { clerkId, role } = await requireAnnouncementCreator();
  const { id: userId } = await getUserDbId(clerkId!);

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return { success: false, error: "Announcement not found" };
  }

  if (announcement.createdBy.toString() !== userId && role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const updated = await Announcement.findByIdAndUpdate(
    id,
    { isPinned: !announcement.isPinned },
    { new: true }
  );

  revalidatePath("/admin/announcements");
  return { success: true, isPinned: updated?.isPinned };
}

// Get target options for announcement form
export async function getAnnouncementTargetOptions() {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!role || !["admin", "hod", "professor"].includes(role)) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return { success: false, error: "User not found" };

  const options: {
    departments: Array<{ _id: string; name: string; code: string }>;
    courses: Array<{ _id: string; name: string; code: string }>;
    classes: Array<{ _id: string; name: string; academicYear: string }>;
  } = {
    departments: [],
    courses: [],
    classes: [],
  };

  if (role === "admin") {
    // Admin can target anything
    const depts = await Department.find({ isActive: true })
      .select("_id name code")
      .lean();
    options.departments = JSON.parse(JSON.stringify(depts));
    const courses = await Course.find({ isActive: true })
      .select("_id name code")
      .lean();
    options.courses = JSON.parse(JSON.stringify(courses));
    const classes = await Class.find({ isActive: true })
      .select("_id name academicYear")
      .lean();
    options.classes = JSON.parse(JSON.stringify(classes));
  } else if (role === "hod" && user.departmentId) {
    // HOD can target their department and its classes
    const depts = await Department.find({ _id: user.departmentId, isActive: true })
      .select("_id name code")
      .lean();
    options.departments = JSON.parse(JSON.stringify(depts));
    const courses = await Course.find({ departmentId: user.departmentId, isActive: true })
      .select("_id name code")
      .lean();
    options.courses = JSON.parse(JSON.stringify(courses));
    // Get classes through courses -> semesters
    const { Semester } = await import("@/lib/db");
    const courseIds = courses.map((c) => c._id);
    const semesters = await Semester.find({ courseId: { $in: courseIds } }).select("_id");
    const semesterIds = semesters.map((s) => s._id);
    const classes = await Class.find({ semesterId: { $in: semesterIds }, isActive: true })
      .select("_id name academicYear")
      .lean();
    options.classes = JSON.parse(JSON.stringify(classes));
  } else if (role === "professor") {
    // Professor can only target their assigned classes
    const { SubjectOffering } = await import("@/lib/db");
    const offerings = await SubjectOffering.find({ professorId: user._id, isActive: true })
      .select("classId")
      .lean();
    const classIds = [...new Set(offerings.map((o) => o.classId.toString()))];
    const classes = await Class.find({ _id: { $in: classIds }, isActive: true })
      .select("_id name academicYear")
      .lean();
    options.classes = JSON.parse(JSON.stringify(classes));
  }

  return {
    success: true,
    options: JSON.parse(JSON.stringify(options)),
    userRole: role,
  };
}
