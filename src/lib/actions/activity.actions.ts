"use server";

import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectDB, Activity, User } from "@/lib/db";
import {
  CreateActivityInput,
  GetActivitiesInput,
  getActivitiesSchema,
} from "@/lib/validations/activity.validation";
import type { ActivityAction, EntityType } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// Helper to get current user's DB ID
async function getCurrentUserDbId(): Promise<string | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  await connectDB();
  const user = await User.findOne({ clerkId }).select("_id");
  return user?._id?.toString() || null;
}

// Log an activity (internal use)
export async function logActivity(
  input: Omit<CreateActivityInput, "userId"> & { userId?: string },
) {
  try {
    await connectDB();

    let userId = input.userId;
    if (!userId) {
      userId = (await getCurrentUserDbId()) || undefined;
    }

    if (!userId) {
      console.warn("Activity logging skipped: No user ID available");
      return null;
    }

    const activity = await Activity.create({
      userId: new mongoose.Types.ObjectId(userId),
      action: input.action,
      entityType: input.entityType,
      entityId: new mongoose.Types.ObjectId(input.entityId),
      details: input.details,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return JSON.parse(JSON.stringify(activity));
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}

// Get activities with filters
export async function getActivities(input: GetActivitiesInput = {}) {
  const validated = getActivitiesSchema.parse(input);
  await connectDB();

  const query: Record<string, unknown> = {};

  if (validated.userId) {
    query.userId = new mongoose.Types.ObjectId(validated.userId);
  }
  if (validated.action) {
    query.action = validated.action;
  }
  if (validated.entityType) {
    query.entityType = validated.entityType;
  }
  if (validated.entityId) {
    query.entityId = new mongoose.Types.ObjectId(validated.entityId);
  }
  if (validated.startDate || validated.endDate) {
    query.createdAt = {};
    if (validated.startDate) {
      (query.createdAt as Record<string, Date>).$gte = validated.startDate;
    }
    if (validated.endDate) {
      (query.createdAt as Record<string, Date>).$lte = validated.endDate;
    }
  }

  const skip = (validated.page - 1) * validated.limit;

  const [activities, total] = await Promise.all([
    Activity.find(query)
      .populate("userId", "firstName lastName email role profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validated.limit)
      .lean(),
    Activity.countDocuments(query),
  ]);

  return {
    activities: JSON.parse(JSON.stringify(activities)),
    pagination: {
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    },
  };
}

// Get recent activities for dashboard (admin actions only)
export async function getRecentActivities(limit = 10) {
  await connectDB();

  // Only show administrative actions
  const adminActions: ActivityAction[] = [
    "user_created",
    "user_updated",
    "user_deactivated",
    "user_reactivated",
    "user_deleted",
    "department_created",
    "department_updated",
    "course_created",
    "course_updated",
    "semester_created",
    "semester_updated",
    "subject_created",
    "subject_updated",
    "class_created",
    "class_updated",
    "subject_offering_created",
    "subject_offering_updated",
    "student_assigned",
    "professor_assigned",
  ];

  const activities = await Activity.find({ action: { $in: adminActions } })
    .populate("userId", "firstName lastName email role profileImage")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return JSON.parse(JSON.stringify(activities));
}

// Get activities for a specific user
export async function getUserActivities(userId: string, limit = 20, page = 1) {
  return getActivities({ userId, limit, page });
}

// Get activities for a specific entity
export async function getEntityActivities(
  entityType: EntityType,
  entityId: string,
  limit = 20,
) {
  await connectDB();

  const activities = await Activity.find({
    entityType,
    entityId: new mongoose.Types.ObjectId(entityId),
  })
    .populate("userId", "firstName lastName email role profileImage")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return JSON.parse(JSON.stringify(activities));
}

// Get submission timeline for a student
export async function getStudentSubmissionTimeline(studentId?: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  await connectDB();

  let dbUserId = studentId;
  if (!dbUserId) {
    const user = await User.findOne({ clerkId }).select("_id");
    if (!user) throw new Error("User not found");
    dbUserId = user._id.toString();
  }

  const activities = await Activity.find({
    userId: new mongoose.Types.ObjectId(dbUserId),
    entityType: "submission",
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return JSON.parse(JSON.stringify(activities));
}

// Get admin audit trail
export async function getAdminAuditTrail(input: GetActivitiesInput = {}) {
  await requireRole(["admin"]);

  // Admin actions to track (administrative actions only)
  const adminActions: ActivityAction[] = [
    "user_created",
    "user_updated",
    "user_deactivated",
    "user_reactivated",
    "user_deleted",
    "department_created",
    "department_updated",
    "course_created",
    "course_updated",
    "semester_created",
    "semester_updated",
    "subject_created",
    "subject_updated",
    "class_created",
    "class_updated",
    "subject_offering_created",
    "subject_offering_updated",
    "student_assigned",
    "professor_assigned",
  ];

  const validated = getActivitiesSchema.parse(input);
  await connectDB();

  const query: Record<string, unknown> = {
    action: { $in: adminActions },
  };

  if (validated.userId) {
    query.userId = new mongoose.Types.ObjectId(validated.userId);
  }
  if (validated.action && adminActions.includes(validated.action)) {
    query.action = validated.action;
  }
  if (validated.entityType) {
    query.entityType = validated.entityType;
  }
  if (validated.startDate || validated.endDate) {
    query.createdAt = {};
    if (validated.startDate) {
      (query.createdAt as Record<string, Date>).$gte = validated.startDate;
    }
    if (validated.endDate) {
      (query.createdAt as Record<string, Date>).$lte = validated.endDate;
    }
  }

  const skip = (validated.page - 1) * validated.limit;

  const [activities, total] = await Promise.all([
    Activity.find(query)
      .populate("userId", "firstName lastName email role profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validated.limit)
      .lean(),
    Activity.countDocuments(query),
  ]);

  return {
    activities: JSON.parse(JSON.stringify(activities)),
    pagination: {
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    },
  };
}

// Get activity stats for dashboard
export async function getActivityStats(days = 7) {
  await connectDB();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await Activity.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          action: "$action",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

  return stats;
}
