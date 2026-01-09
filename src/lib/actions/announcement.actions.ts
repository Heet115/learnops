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
  return { clerkId: userId, role };
}

async function getUserDbId(clerkId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true });
  if (!user) throw new Error("User not found");
  return { id: user._id.toString(), user };
}

// Helper to get target name
async function getTargetName(target: {
  type: string;
  id?: mongoose.Types.ObjectId;
  role?: string;
}) {
  if (target.type === "all") return "All Users";
  if (target.type === "role") return `All ${target.role}s`;

  if (!target.id) return target.type;

  await connectDB();

  if (target.type === "department") {
    const dept = await Department.findById(target.id)
      .select("name code")
      .lean();
    return dept ? `${dept.name} (${dept.code})` : "Department";
  }
  if (target.type === "course") {
    const course = await Course.findById(target.id).select("name code").lean();
    return course ? `${course.name} (${course.code})` : "Course";
  }
  if (target.type === "class") {
    const cls = await Class.findById(target.id)
      .select("name academicYear")
      .lean();
    return cls ? `${cls.name} (${cls.academicYear})` : "Class";
  }

  return target.type;
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

    // Validate target based on role
    if (role === "professor") {
      // Professors can only target their classes
      if (
        validated.target.type === "all" ||
        validated.target.type === "department"
      ) {
        return {
          success: false,
          error: "Professors can only create announcements for their classes",
        };
      }
    }

    if (role === "hod") {
      // HODs can target their department or classes within it
      if (validated.target.type === "all") {
        return {
          success: false,
          error: "HODs can only create announcements for their department",
        };
      }
    }

    const announcementData: Record<string, unknown> = {
      title: validated.title,
      content: validated.content,
      createdBy: userId,
      target: {
        type: validated.target.type,
        id: validated.target.id
          ? new mongoose.Types.ObjectId(validated.target.id)
          : undefined,
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
      action: "ala_created",
      entityType: "ala",
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
    const targetConditions: Record<string, unknown>[] = [
      { "target.type": "all" },
      { "target.type": "role", "target.role": role },
    ];

    // Department-based targeting
    if (user.departmentId) {
      targetConditions.push({
        "target.type": "department",
        "target.id": user.departmentId,
      });
    }

    // For students: check their class and course
    if (role === "student" && user.classId) {
      targetConditions.push({
        "target.type": "class",
        "target.id": user.classId,
      });

      // Get course from class -> semester -> course
      const classDoc = await Class.findById(user.classId).populate({
        path: "semesterId",
        select: "courseId",
      });
      if (classDoc?.semesterId) {
        const semester = classDoc.semesterId as unknown as {
          courseId: mongoose.Types.ObjectId;
        };
        targetConditions.push({
          "target.type": "course",
          "target.id": semester.courseId,
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
        .populate({
          path: "classId",
          select: "semesterId",
          populate: { path: "semesterId", select: "courseId" },
        })
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
        .populate({
          path: "classId",
          select: "semesterId",
          populate: { path: "semesterId", select: "courseId" },
        })
        .lean();

      // Combine class IDs from both sources
      const classIds = new Set<string>();
      const courseIds = new Set<string>();

      // From subject offerings
      for (const offering of offerings) {
        if (offering.classId) {
          const cls = offering.classId as unknown as {
            _id: mongoose.Types.ObjectId;
            semesterId?: { courseId?: mongoose.Types.ObjectId };
          };
          classIds.add(cls._id.toString());

          if (cls.semesterId?.courseId) {
            courseIds.add(cls.semesterId.courseId.toString());
          }
        }
      }

      // From class coordinator assignments
      for (const coord of coordinatorAssignments) {
        if (coord.classId) {
          const cls = coord.classId as unknown as {
            _id: mongoose.Types.ObjectId;
            semesterId?: { courseId?: mongoose.Types.ObjectId };
          };
          classIds.add(cls._id.toString());

          if (cls.semesterId?.courseId) {
            courseIds.add(cls.semesterId.courseId.toString());
          }
        }
      }

      // Add class targeting
      for (const classId of classIds) {
        targetConditions.push({
          "target.type": "class",
          "target.id": new mongoose.Types.ObjectId(classId),
        });
      }

      // Add course targeting
      for (const courseId of courseIds) {
        targetConditions.push({
          "target.type": "course",
          "target.id": new mongoose.Types.ObjectId(courseId),
        });
      }
    }

    // For HODs: they already have departmentId, also add courses in their department
    if (role === "hod" && user.departmentId) {
      const courses = await Course.find({
        departmentId: user.departmentId,
        isActive: true,
      })
        .select("_id")
        .lean();

      for (const course of courses) {
        targetConditions.push({
          "target.type": "course",
          "target.id": course._id,
        });
      }

      // Also get classes in their department
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
          "target.type": "class",
          "target.id": cls._id,
        });
      }
    }

    const query = {
      isActive: true,
      $and: [
        {
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
        },
        { $or: targetConditions },
      ],
    };

    const announcements = await Announcement.find(query)
      .populate("createdBy", "firstName lastName role")
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(50)
      .lean();

    // Enrich with target names
    const enrichedAnnouncements = await Promise.all(
      announcements.map(async (ann) => ({
        ...ann,
        targetName: await getTargetName(ann.target),
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
        targetName: await getTargetName(ann.target),
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
        targetName: await getTargetName(ann.target),
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
    targetName: await getTargetName(announcement.target),
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
    { new: true },
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
      .select("_id name code")
      .lean();
    options.courses = JSON.parse(JSON.stringify(courses));
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
    // Professor can only target their assigned classes
    const { SubjectOffering } = await import("@/lib/db");
    const offerings = await SubjectOffering.find({
      professorId: user._id,
      isActive: true,
    })
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
