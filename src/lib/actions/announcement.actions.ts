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
    throw new Error(
      "Unauthorized: Only admin, HOD, or professor can create announcements",
    );
  }
  return { clerkId: userId, role: role as "admin" | "hod" | "professor" };
}

async function getUserDbId(clerkId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true });
  if (!user) throw new Error("User not found");
  return { id: user._id.toString(), user };
}

// Helper to get target name for display
async function getTargetName(
  targetType: string,
  targetId?: mongoose.Types.ObjectId,
): Promise<string> {
  if (targetType === "all") return "All Users";

  if (!targetId) return targetType;

  await connectDB();

  if (targetType === "department") {
    const dept = await Department.findById(targetId).select("name code").lean();
    return dept ? `${dept.name} (${dept.code})` : "Department";
  }
  if (targetType === "class") {
    const cls = await Class.findById(targetId)
      .select("name academicYear")
      .lean();
    return cls ? `${cls.name} (${cls.academicYear})` : "Class";
  }
  if (targetType === "subject_offering") {
    const { SubjectOffering } = await import("@/lib/db");
    const offering = await SubjectOffering.findById(targetId)
      .populate("subjectId", "name code")
      .lean();
    if (offering && offering.subjectId) {
      const subject = offering.subjectId as unknown as {
        name: string;
        code: string;
      };
      return `${subject.name} (${subject.code})`;
    }
    return "Subject Offering";
  }

  return targetType;
}

// Create announcement
export async function createAnnouncement(input: CreateAnnouncementInput) {
  try {
    const { clerkId, role } = await requireAnnouncementCreator();

    // Validate input with Zod
    const parseResult = createAnnouncementSchema.safeParse(input);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(", ");
      return { success: false, error: errors };
    }

    const validated = parseResult.data;
    const { id: userId } = await getUserDbId(clerkId!);

    const targetType = validated.target.type;

    // Validate target based on role
    if (role === "professor") {
      if (targetType === "all" || targetType === "department") {
        return {
          success: false,
          error: "Professors can only create announcements for their classes",
        };
      }
    }

    if (role === "hod") {
      if (targetType === "all") {
        return {
          success: false,
          error: "HODs can only create announcements for their department",
        };
      }
    }

    const announcementData: Record<string, unknown> = {
      title: validated.title,
      message: validated.content, // Map content -> message (model field)
      createdBy: userId,
      createdByRole: role,
      targetType: targetType,
      targetId: validated.target.id
        ? new mongoose.Types.ObjectId(validated.target.id)
        : undefined,
      priority: validated.priority,
      isPublished: true,
      isActive: true,
    };

    if (validated.expiresAt) {
      announcementData.expiresAt = new Date(validated.expiresAt);
    }

    const announcement = await Announcement.create(announcementData);

    await logActivity({
      action: "ala_created",
      entityType: "ala",
      entityId: announcement._id.toString(),
      details: {
        type: "announcement",
        title: validated.title,
        targetType: targetType,
        targetId: validated.target.id,
      },
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/hod/announcements");
    revalidatePath("/professor/announcements");
    revalidatePath("/student/announcements");
    return {
      success: true,
      announcement: JSON.parse(JSON.stringify(announcement)),
    };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Failed to create announcement" };
  }
}

// Get announcements for current user (students, professors, HODs)
export async function getAnnouncementsForUser() {
  try {
    const { sessionClaims, userId } = await auth();
    if (!userId) return [];

    const role = (sessionClaims?.metadata as { role?: string })?.role;
    await connectDB();
    const user = await User.findOne({ clerkId: userId, isActive: true });
    if (!user) return [];

    const now = new Date();

    // Build target conditions based on user role and assignments
    const targetConditions: Record<string, unknown>[] = [{ targetType: "all" }];

    // Department-based targeting
    if (user.departmentId) {
      targetConditions.push({
        targetType: "department",
        targetId: user.departmentId,
      });
    }

    // For students: check their class
    if (role === "student" && user.classId) {
      targetConditions.push({
        targetType: "class",
        targetId: user.classId,
      });

      // Also check subject offerings for this student's class
      const { SubjectOffering } = await import("@/lib/db");
      const offerings = await SubjectOffering.find({
        classId: user.classId,
        isActive: true,
      })
        .select("_id")
        .lean();

      for (const offering of offerings) {
        targetConditions.push({
          targetType: "subject_offering",
          targetId: offering._id,
        });
      }
    }

    // For professors: check classes they teach AND classes they coordinate
    if (role === "professor") {
      const { SubjectOffering, ClassCoordinator } = await import("@/lib/db");

      // Get classes from subject offerings (teaching)
      const offerings = await SubjectOffering.find({
        professorId: user._id,
        isActive: true,
      })
        .select("classId")
        .lean();

      // Get classes from class coordinator assignments
      const currentYear = new Date().getFullYear().toString();
      const coordinatorAssignments = await ClassCoordinator.find({
        professorId: user._id,
        isActive: true,
        academicYear: {
          $in: [
            currentYear,
            `${parseInt(currentYear) - 1}-${currentYear}`,
            `${currentYear}-${parseInt(currentYear) + 1}`,
          ],
        },
      })
        .select("classId")
        .lean();

      // Combine class IDs from both sources
      const classIds = new Set<string>();

      for (const offering of offerings) {
        if (offering.classId) {
          classIds.add(offering.classId.toString());
        }
      }

      for (const coord of coordinatorAssignments) {
        if (coord.classId) {
          classIds.add(coord.classId.toString());
        }
      }

      // Add class targeting
      for (const classId of classIds) {
        targetConditions.push({
          targetType: "class",
          targetId: new mongoose.Types.ObjectId(classId),
        });
      }
    }

    // For HODs: they already have departmentId, also add classes in their department
    if (role === "hod" && user.departmentId) {
      const courses = await Course.find({
        departmentId: user.departmentId,
        isActive: true,
      })
        .select("_id")
        .lean();

      // Get classes in their department
      const { Semester } = await import("@/lib/db");
      const courseIds = courses.map((c) => c._id);
      const semesters = await Semester.find({ courseId: { $in: courseIds } })
        .select("_id")
        .lean();
      const semesterIds = semesters.map((s) => s._id);
      const classes = await Class.find({
        semesterId: { $in: semesterIds },
        isActive: true,
      })
        .select("_id")
        .lean();

      for (const cls of classes) {
        targetConditions.push({
          targetType: "class",
          targetId: cls._id,
        });
      }
    }

    const query = {
      isActive: true,
      isPublished: true,
      $and: [
        {
          $or: [
            { publishAt: { $exists: false } },
            { publishAt: { $lte: now } },
          ],
        },
        {
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
        },
        { $or: targetConditions },
      ],
    };

    const announcements = await Announcement.find(query)
      .populate("createdBy", "firstName lastName role")
      .sort({ priority: -1, createdAt: -1 })
      .limit(50)
      .lean();

    // Enrich with target names
    const enrichedAnnouncements = await Promise.all(
      announcements.map(async (ann) => ({
        ...ann,
        targetName: await getTargetName(ann.targetType, ann.targetId),
      })),
    );

    return JSON.parse(JSON.stringify(enrichedAnnouncements));
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
}

// Get all announcements (admin only)
export async function getAllAnnouncements() {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (role !== "admin") {
      return { success: false, error: "Unauthorized", data: [] };
    }

    await connectDB();
    const announcements = await Announcement.find()
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with target names
    const enrichedAnnouncements = await Promise.all(
      announcements.map(async (ann) => ({
        ...ann,
        targetName: await getTargetName(ann.targetType, ann.targetId),
      })),
    );

    return {
      success: true,
      data: JSON.parse(JSON.stringify(enrichedAnnouncements)),
    };
  } catch (error) {
    console.error("Error fetching all announcements:", error);
    return { success: false, error: "Failed to fetch announcements", data: [] };
  }
}

// Get announcements created by current user (for professors/HODs)
export async function getMyAnnouncements() {
  try {
    const { clerkId } = await requireAnnouncementCreator();
    const { id: userId } = await getUserDbId(clerkId!);

    const announcements = await Announcement.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with target names
    const enrichedAnnouncements = await Promise.all(
      announcements.map(async (ann) => ({
        ...ann,
        targetName: await getTargetName(ann.targetType, ann.targetId),
      })),
    );

    return {
      success: true,
      data: JSON.parse(JSON.stringify(enrichedAnnouncements)),
    };
  } catch (error) {
    console.error("Error fetching my announcements:", error);
    return { success: false, error: "Failed to fetch announcements", data: [] };
  }
}

// Get single announcement by ID
export async function getAnnouncementById(id: string) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!role) throw new Error("Unauthorized");

  await connectDB();
  const announcement = await Announcement.findById(id)
    .populate("createdBy", "firstName lastName role email")
    .lean();

  if (!announcement) return null;

  const enriched = {
    ...announcement,
    targetName: await getTargetName(
      announcement.targetType,
      announcement.targetId,
    ),
  };

  return JSON.parse(JSON.stringify(enriched));
}

// Update announcement
export async function updateAnnouncement(
  id: string,
  input: UpdateAnnouncementInput,
) {
  try {
    const { clerkId, role } = await requireAnnouncementCreator();

    // Validate input with Zod
    const parseResult = updateAnnouncementSchema.safeParse(input);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(", ");
      return { success: false, error: errors };
    }

    const validated = parseResult.data;
    const { id: userId } = await getUserDbId(clerkId!);

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    // Only creator or admin can update
    if (announcement.createdBy.toString() !== userId && role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: Record<string, unknown> = {};

    if (validated.title) updateData.title = validated.title;
    if (validated.content) updateData.message = validated.content;
    if (validated.priority) updateData.priority = validated.priority;
    if (validated.isActive !== undefined)
      updateData.isActive = validated.isActive;

    if (validated.expiresAt) {
      updateData.expiresAt = new Date(validated.expiresAt);
    } else if (validated.expiresAt === null) {
      updateData.$unset = { expiresAt: 1 };
    }

    if (validated.target) {
      updateData.targetType = validated.target.type;
      if (validated.target.id) {
        updateData.targetId = new mongoose.Types.ObjectId(validated.target.id);
      }
    }

    const updated = await Announcement.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/hod/announcements");
    revalidatePath("/professor/announcements");
    revalidatePath("/student/announcements");
    return { success: true, announcement: JSON.parse(JSON.stringify(updated)) };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: "Failed to update announcement" };
  }
}

// Delete announcement
export async function deleteAnnouncement(id: string) {
  try {
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
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: "Failed to delete announcement" };
  }
}

// Toggle publish status
export async function toggleAnnouncementPublish(id: string) {
  try {
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
      { isPublished: !announcement.isPublished },
      { new: true },
    );

    revalidatePath("/admin/announcements");
    return { success: true, isPublished: updated?.isPublished };
  } catch (error) {
    console.error("Error toggling announcement publish:", error);
    return { success: false, error: "Failed to toggle publish status" };
  }
}

// Get target options for announcement form
export async function getAnnouncementTargetOptions() {
  try {
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
      classes: Array<{ _id: string; name: string; academicYear: string }>;
      subjectOfferings: Array<{
        _id: string;
        subjectName: string;
        className: string;
      }>;
    } = {
      departments: [],
      classes: [],
      subjectOfferings: [],
    };

    if (role === "admin") {
      // Admin can target anything
      const depts = await Department.find({ isActive: true })
        .select("_id name code")
        .lean();
      options.departments = JSON.parse(JSON.stringify(depts));

      const classes = await Class.find({ isActive: true })
        .select("_id name academicYear")
        .lean();
      options.classes = JSON.parse(JSON.stringify(classes));
    } else if (role === "hod" && user.departmentId) {
      // HOD can target their department and its classes
      const depts = await Department.find({
        _id: user.departmentId,
        isActive: true,
      })
        .select("_id name code")
        .lean();
      options.departments = JSON.parse(JSON.stringify(depts));

      const courses = await Course.find({
        departmentId: user.departmentId,
        isActive: true,
      })
        .select("_id")
        .lean();

      // Get classes through courses -> semesters
      const { Semester } = await import("@/lib/db");
      const courseIds = courses.map((c) => c._id);
      const semesters = await Semester.find({
        courseId: { $in: courseIds },
      }).select("_id");
      const semesterIds = semesters.map((s) => s._id);
      const classes = await Class.find({
        semesterId: { $in: semesterIds },
        isActive: true,
      })
        .select("_id name academicYear")
        .lean();
      options.classes = JSON.parse(JSON.stringify(classes));
    } else if (role === "professor") {
      // Professor can only target their assigned classes and subject offerings
      const { SubjectOffering } = await import("@/lib/db");
      const offerings = await SubjectOffering.find({
        professorId: user._id,
        isActive: true,
      })
        .populate("classId", "name academicYear")
        .populate("subjectId", "name code")
        .lean();

      const classIds = new Set<string>();
      const subjectOfferingsList: Array<{
        _id: string;
        subjectName: string;
        className: string;
      }> = [];

      for (const offering of offerings) {
        if (offering.classId) {
          const cls = offering.classId as unknown as {
            _id: mongoose.Types.ObjectId;
            name: string;
            academicYear: string;
          };
          classIds.add(cls._id.toString());
        }

        if (offering.subjectId && offering.classId) {
          const subject = offering.subjectId as unknown as {
            name: string;
            code: string;
          };
          const cls = offering.classId as unknown as { name: string };
          subjectOfferingsList.push({
            _id: offering._id.toString(),
            subjectName: `${subject.name} (${subject.code})`,
            className: cls.name,
          });
        }
      }

      const classes = await Class.find({
        _id: { $in: Array.from(classIds) },
        isActive: true,
      })
        .select("_id name academicYear")
        .lean();
      options.classes = JSON.parse(JSON.stringify(classes));
      options.subjectOfferings = subjectOfferingsList;
    }

    return {
      success: true,
      options: JSON.parse(JSON.stringify(options)),
      userRole: role,
    };
  } catch (error) {
    console.error("Error fetching target options:", error);
    return { success: false, error: "Failed to fetch target options" };
  }
}
