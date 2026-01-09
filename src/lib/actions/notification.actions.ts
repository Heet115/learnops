"use server";

import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import {
  connectDB,
  Notification,
  User,
  ALA,
  Submission,
  Group,
  Announcement,
  SubjectOffering,
} from "@/lib/db";
import type { NotificationType } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { pushNotificationToUser } from "@/lib/sse";
import { shouldNotify } from "./notification-preferences.actions";

// ==================== USER NOTIFICATION ACTIONS ====================

// Get current user's notifications with pagination
export async function getNotifications(limit = 20, skip = 0) {
  const { userId } = await auth();
  if (!userId) return { notifications: [], total: 0 };

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return { notifications: [], total: 0 };

  const [notifications, total] = await Promise.all([
    Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId: user._id }),
  ]);

  return {
    notifications: JSON.parse(JSON.stringify(notifications)),
    total,
  };
}

// Get unread notification count
export async function getUnreadCount() {
  const { userId } = await auth();
  if (!userId) return 0;

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return 0;

  return Notification.countDocuments({ userId: user._id, isRead: false });
}

// Mark notification as read
export async function markAsRead(notificationId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false };

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return { success: false };

  await Notification.findOneAndUpdate(
    { _id: notificationId, userId: user._id },
    { isRead: true }
  );

  revalidatePath("/");
  return { success: true };
}

// Mark all notifications as read
export async function markAllAsRead() {
  const { userId } = await auth();
  if (!userId) return { success: false };

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return { success: false };

  await Notification.updateMany(
    { userId: user._id, isRead: false },
    { isRead: true }
  );

  revalidatePath("/");
  return { success: true };
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false };

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return { success: false };

  await Notification.findOneAndDelete({
    _id: notificationId,
    userId: user._id,
  });

  revalidatePath("/");
  return { success: true };
}

// Delete all read notifications
export async function deleteAllRead() {
  const { userId } = await auth();
  if (!userId) return { success: false };

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return { success: false };

  const result = await Notification.deleteMany({
    userId: user._id,
    isRead: true,
  });

  revalidatePath("/");
  return { success: true, count: result.deletedCount };
}


// ==================== NOTIFICATION CREATORS ====================

// Generic create notification (exported for use by other modules)
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: "ala" | "submission" | "group" | "announcement";
  metadata?: Record<string, unknown>;
}) {
  await connectDB();

  // Check user preferences
  const shouldSend = await shouldNotify(data.userId, data.type);
  if (!shouldSend) return null;

  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(data.userId),
    type: data.type,
    title: data.title,
    message: data.message,
    relatedId: data.relatedId
      ? new mongoose.Types.ObjectId(data.relatedId)
      : undefined,
    relatedType: data.relatedType,
    metadata: data.metadata,
  });

  // Push real-time notification
  await pushNotificationToUser(data.userId, {
    _id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedId: notification.relatedId?.toString(),
    relatedType: notification.relatedType,
    createdAt: notification.createdAt,
    isRead: false,
  });

  return notification;
}

// Helper to create and push notification (internal use)
async function createAndPush(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: "ala" | "submission" | "group" | "announcement";
  metadata?: Record<string, unknown>;
}) {
  // Check user preferences
  const shouldSend = await shouldNotify(data.userId, data.type);
  if (!shouldSend) return null;

  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(data.userId),
    type: data.type,
    title: data.title,
    message: data.message,
    relatedId: data.relatedId
      ? new mongoose.Types.ObjectId(data.relatedId)
      : undefined,
    relatedType: data.relatedType,
    metadata: data.metadata,
  });

  // Push real-time notification
  await pushNotificationToUser(data.userId, {
    _id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedId: notification.relatedId?.toString(),
    relatedType: notification.relatedType,
    createdAt: notification.createdAt,
    isRead: false,
  });

  return notification;
}

// Batch create notifications for multiple users
async function createBatchNotifications(
  userIds: string[],
  data: {
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: "ala" | "submission" | "group" | "announcement";
    metadata?: Record<string, unknown>;
  }
) {
  const notifications = [];

  for (const userId of userIds) {
    const shouldSend = await shouldNotify(userId, data.type);
    if (shouldSend) {
      notifications.push({
        userId: new mongoose.Types.ObjectId(userId),
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId
          ? new mongoose.Types.ObjectId(data.relatedId)
          : undefined,
        relatedType: data.relatedType,
        metadata: data.metadata,
        isRead: false,
      });
    }
  }

  if (notifications.length === 0) return [];

  const created = await Notification.insertMany(notifications);

  // Push real-time to all users
  for (const notification of created) {
    await pushNotificationToUser(notification.userId.toString(), {
      _id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId?.toString(),
      relatedType: notification.relatedType,
      createdAt: notification.createdAt,
      isRead: false,
    });
  }

  return created;
}

// ==================== ALA NOTIFICATIONS ====================

// Notify students about new ALA
export async function notifyNewALA(alaId: string) {
  await connectDB();

  const ala = await ALA.findById(alaId).populate({
    path: "subjectOfferingId",
    select: "classId subjectId",
    populate: { path: "subjectId", select: "name code" },
  });

  if (!ala) return;

  const offering = ala.subjectOfferingId as unknown as {
    classId: mongoose.Types.ObjectId;
    subjectId?: { name: string; code: string };
  };

  // Get all students in the class
  const students = await User.find({
    role: "student",
    classId: offering.classId,
    isActive: true,
  }).select("_id");

  const studentIds = students.map((s) => s._id.toString());

  await createBatchNotifications(studentIds, {
    type: "new_ala",
    title: "New ALA Posted",
    message: `${offering.subjectId?.code || "Subject"}: ${ala.title}`,
    relatedId: ala._id.toString(),
    relatedType: "ala",
    metadata: {
      subjectCode: offering.subjectId?.code,
      subjectName: offering.subjectId?.name,
      deadline: ala.deadline,
    },
  });
}

// Notify about deadline reminder
export async function notifyDeadlineReminder(alaId: string, studentId: string) {
  await connectDB();

  const ala = await ALA.findById(alaId).populate({
    path: "subjectOfferingId",
    select: "subjectId",
    populate: { path: "subjectId", select: "code name" },
  });

  if (!ala) return;

  const offering = ala.subjectOfferingId as unknown as {
    subjectId?: { code: string; name: string };
  };

  const hoursLeft = Math.round(
    (new Date(ala.deadline).getTime() - Date.now()) / (60 * 60 * 1000)
  );
  const timeMessage =
    hoursLeft <= 1
      ? "less than an hour"
      : hoursLeft < 24
        ? `${hoursLeft} hours`
        : `${Math.round(hoursLeft / 24)} day(s)`;

  await createAndPush({
    userId: studentId,
    type: "deadline_reminder",
    title: "Deadline Approaching",
    message: `${offering.subjectId?.code || "ALA"}: "${ala.title}" is due in ${timeMessage}`,
    relatedId: ala._id.toString(),
    relatedType: "ala",
    metadata: {
      deadline: ala.deadline,
      hoursLeft,
    },
  });
}


// ==================== SUBMISSION NOTIFICATIONS ====================

// Notify when submission is graded (includes group members)
export async function notifySubmissionGraded(
  submissionId: string,
  alaTitle: string,
  marks: number,
  maxMarks: number,
  adjustedMarks?: number
) {
  await connectDB();

  const submission = await Submission.findById(submissionId);
  if (!submission) return;

  // Get all recipients (submitter + group members)
  const recipientIds: string[] = [submission.studentId.toString()];
  
  if (submission.groupMembers && submission.groupMembers.length > 0) {
    submission.groupMembers.forEach((memberId: mongoose.Types.ObjectId) => {
      recipientIds.push(memberId.toString());
    });
  }

  const marksDisplay = adjustedMarks !== undefined 
    ? `${adjustedMarks}/${maxMarks} (adjusted from ${marks})`
    : `${marks}/${maxMarks}`;

  await createBatchNotifications(recipientIds, {
    type: "submission_graded",
    title: "Submission Graded",
    message: `Your submission for "${alaTitle}" has been graded: ${marksDisplay}`,
    relatedId: submissionId,
    relatedType: "submission",
    metadata: {
      marks,
      maxMarks,
      adjustedMarks,
      alaTitle,
    },
  });
}

// Notify when submission is rejected (includes group members)
export async function notifySubmissionRejected(
  submissionId: string,
  alaTitle: string,
  reason: string
) {
  await connectDB();

  const submission = await Submission.findById(submissionId);
  if (!submission) return;

  // Get all recipients (submitter + group members)
  const recipientIds: string[] = [submission.studentId.toString()];
  
  if (submission.groupMembers && submission.groupMembers.length > 0) {
    submission.groupMembers.forEach((memberId: mongoose.Types.ObjectId) => {
      recipientIds.push(memberId.toString());
    });
  }

  await createBatchNotifications(recipientIds, {
    type: "submission_rejected",
    title: "Submission Rejected",
    message: `Your submission for "${alaTitle}" was rejected: ${reason}`,
    relatedId: submissionId,
    relatedType: "submission",
    metadata: {
      reason,
      alaTitle,
    },
  });
}

// ==================== GROUP NOTIFICATIONS ====================

// Notify student about group invitation
export async function notifyGroupInvite(
  groupId: string,
  invitedStudentId: string,
  groupName: string,
  inviterName: string,
  alaTitle: string
) {
  await connectDB();

  await createAndPush({
    userId: invitedStudentId,
    type: "group_invite",
    title: "Group Invitation",
    message: `${inviterName} invited you to join "${groupName}" for "${alaTitle}"`,
    relatedId: groupId,
    relatedType: "group",
    metadata: {
      groupName,
      inviterName,
      alaTitle,
    },
  });
}

// Notify group members when someone joins
export async function notifyGroupJoined(
  groupId: string,
  joinedStudentName: string,
  excludeStudentId: string
) {
  await connectDB();

  const group = await Group.findById(groupId).populate("alaId", "title");
  if (!group) return;

  const ala = group.alaId as unknown as { title: string };

  // Get accepted members except the one who joined
  const memberIds = group.members
    .filter(
      (m: { status: string; studentId: mongoose.Types.ObjectId }) =>
        m.status === "accepted" && m.studentId.toString() !== excludeStudentId
    )
    .map((m: { studentId: mongoose.Types.ObjectId }) => m.studentId.toString());

  if (memberIds.length === 0) return;

  await createBatchNotifications(memberIds, {
    type: "group_joined",
    title: "New Group Member",
    message: `${joinedStudentName} joined your group "${group.name}" for "${ala.title}"`,
    relatedId: groupId,
    relatedType: "group",
    metadata: {
      groupName: group.name,
      memberName: joinedStudentName,
    },
  });
}

// Notify group members when someone leaves
export async function notifyGroupLeft(
  groupId: string,
  leftStudentName: string,
  excludeStudentId: string
) {
  await connectDB();

  const group = await Group.findById(groupId).populate("alaId", "title");
  if (!group) return;

  const ala = group.alaId as unknown as { title: string };

  // Get accepted members except the one who left
  const memberIds = group.members
    .filter(
      (m: { status: string; studentId: mongoose.Types.ObjectId }) =>
        m.status === "accepted" && m.studentId.toString() !== excludeStudentId
    )
    .map((m: { studentId: mongoose.Types.ObjectId }) => m.studentId.toString());

  if (memberIds.length === 0) return;

  await createBatchNotifications(memberIds, {
    type: "group_left",
    title: "Member Left Group",
    message: `${leftStudentName} left your group "${group.name}" for "${ala.title}"`,
    relatedId: groupId,
    relatedType: "group",
    metadata: {
      groupName: group.name,
      memberName: leftStudentName,
    },
  });
}


// ==================== ANNOUNCEMENT NOTIFICATIONS ====================

// Create announcement and notify target users
export async function createAnnouncement(data: {
  title: string;
  message: string;
  targetType: "all" | "department" | "class" | "subject_offering";
  targetId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  publishAt?: Date;
  expiresAt?: Date;
}) {
  const { userId: clerkId, sessionClaims } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized" };

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!role || !["admin", "hod", "professor"].includes(role)) {
    return { success: false, error: "Only admin, HOD, or professor can create announcements" };
  }

  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true });
  if (!user) return { success: false, error: "User not found" };

  // Validate target based on role
  if (role === "professor" && data.targetType !== "subject_offering") {
    return { success: false, error: "Professors can only create announcements for their subject offerings" };
  }

  // Create announcement
  const announcement = await Announcement.create({
    title: data.title,
    message: data.message,
    createdBy: user._id,
    createdByRole: role,
    targetType: data.targetType,
    targetId: data.targetId ? new mongoose.Types.ObjectId(data.targetId) : undefined,
    priority: data.priority || "normal",
    publishAt: data.publishAt,
    expiresAt: data.expiresAt,
    isPublished: !data.publishAt || new Date(data.publishAt) <= new Date(),
  });

  // If published immediately, send notifications
  if (announcement.isPublished) {
    await sendAnnouncementNotifications(announcement._id.toString());
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/professor/announcements");
  return { success: true, announcement: JSON.parse(JSON.stringify(announcement)) };
}

// Send notifications for an announcement
export async function sendAnnouncementNotifications(announcementId: string) {
  await connectDB();

  const announcement = await Announcement.findById(announcementId).populate(
    "createdBy",
    "firstName lastName"
  );
  if (!announcement || !announcement.isPublished) return;

  const creator = announcement.createdBy as unknown as {
    firstName: string;
    lastName: string;
  };

  // Get target users based on targetType
  let targetUsers: { _id: mongoose.Types.ObjectId }[] = [];

  switch (announcement.targetType) {
    case "all":
      // All active students
      targetUsers = await User.find({
        role: "student",
        isActive: true,
      }).select("_id");
      break;

    case "department":
      // Students in classes under this department's courses
      const { Class, Course } = await import("@/lib/db");
      const courses = await Course.find({
        departmentId: announcement.targetId,
        isActive: true,
      }).select("_id");
      const courseIds = courses.map((c) => c._id);
      const classes = await Class.find({
        courseId: { $in: courseIds },
        isActive: true,
      }).select("_id");
      const classIds = classes.map((c) => c._id);
      targetUsers = await User.find({
        role: "student",
        classId: { $in: classIds },
        isActive: true,
      }).select("_id");
      break;

    case "class":
      // Students in specific class
      targetUsers = await User.find({
        role: "student",
        classId: announcement.targetId,
        isActive: true,
      }).select("_id");
      break;

    case "subject_offering":
      // Students in the class of this subject offering
      const offering = await SubjectOffering.findById(announcement.targetId);
      if (offering) {
        targetUsers = await User.find({
          role: "student",
          classId: offering.classId,
          isActive: true,
        }).select("_id");
      }
      break;
  }

  if (targetUsers.length === 0) return;

  const userIds = targetUsers.map((u) => u._id.toString());

  await createBatchNotifications(userIds, {
    type: "announcement",
    title: announcement.title,
    message: `${creator.firstName} ${creator.lastName}: ${announcement.message.substring(0, 100)}${announcement.message.length > 100 ? "..." : ""}`,
    relatedId: announcement._id.toString(),
    relatedType: "announcement",
    metadata: {
      priority: announcement.priority,
      createdBy: `${creator.firstName} ${creator.lastName}`,
    },
  });
}

// Get announcements for current user
export async function getAnnouncements(limit = 10) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return [];

  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true });
  if (!user) return [];

  const now = new Date();
  const query: Record<string, unknown> = {
    isActive: true,
    isPublished: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  };

  // Build target query based on user role
  if (user.role === "student" && user.classId) {
    // Get department and subject offerings for this student
    const { Class, Course, SubjectOffering } = await import("@/lib/db");
    const studentClass = await Class.findById(user.classId);
    const course = studentClass
      ? await Course.findById(studentClass.courseId)
      : null;
    const offerings = await SubjectOffering.find({
      classId: user.classId,
      isActive: true,
    }).select("_id");
    const offeringIds = offerings.map((o) => o._id);

    query.$or = [
      { targetType: "all" },
      { targetType: "class", targetId: user.classId },
      { targetType: "subject_offering", targetId: { $in: offeringIds } },
    ];

    if (course?.departmentId) {
      (query.$or as Record<string, unknown>[]).push({
        targetType: "department",
        targetId: course.departmentId,
      });
    }
  }

  const announcements = await Announcement.find(query)
    .populate("createdBy", "firstName lastName")
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return JSON.parse(JSON.stringify(announcements));
}


// ==================== CRON JOB FUNCTIONS ====================

// Batch create deadline reminders (called by cron job)
export async function createDeadlineReminders() {
  await connectDB();

  const now = new Date();
  const maxHours = 72;
  const futureLimit = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

  // Find ALAs with deadline in next 72 hours that aren't locked
  const alas = await ALA.find({
    deadline: { $gte: now, $lte: futureLimit },
    isLocked: false,
    isActive: true,
  }).populate({
    path: "subjectOfferingId",
    select: "classId subjectId",
    populate: { path: "subjectId", select: "code" },
  });

  const { NotificationPreferences } = await import("@/lib/db");
  let remindersSent = 0;

  for (const ala of alas) {
    const offering = ala.subjectOfferingId as unknown as {
      classId: mongoose.Types.ObjectId;
      subjectId?: { code: string };
    };

    // Get students who haven't submitted yet
    const submittedStudentIds = await Submission.find({
      alaId: ala._id,
      status: { $in: ["submitted", "graded"] },
    }).distinct("studentId");

    // Also check group submissions
    const groupSubmittedStudentIds = await Submission.find({
      alaId: ala._id,
      status: { $in: ["submitted", "graded"] },
    }).distinct("groupMembers");

    const allSubmittedIds = [
      ...submittedStudentIds.map((id) => id.toString()),
      ...groupSubmittedStudentIds.map((id) => id.toString()),
    ];

    const students = await User.find({
      role: "student",
      classId: offering.classId,
      isActive: true,
      _id: { $nin: allSubmittedIds },
    }).select("_id");

    // Check if reminder already sent today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const existingReminders = await Notification.find({
      relatedId: ala._id,
      type: "deadline_reminder",
      createdAt: { $gte: todayStart },
    }).distinct("userId");

    const existingSet = new Set(existingReminders.map((id) => id.toString()));

    for (const student of students) {
      const studentId = student._id.toString();

      // Skip if already reminded today
      if (existingSet.has(studentId)) continue;

      // Get user's preferred reminder hours
      const prefs = await NotificationPreferences.findOne({
        userId: student._id,
      });
      const reminderHours = prefs?.deadlineReminderHours || 24;

      // Check if deadline is within user's preferred reminder window
      const deadlineTime = new Date(ala.deadline).getTime();
      const reminderThreshold = now.getTime() + reminderHours * 60 * 60 * 1000;

      if (deadlineTime <= reminderThreshold) {
        await notifyDeadlineReminder(ala._id.toString(), studentId);
        remindersSent++;
      }
    }
  }

  return { success: true, remindersSent };
}

// Publish scheduled announcements (called by cron job)
export async function publishScheduledAnnouncements() {
  await connectDB();

  const now = new Date();

  // Find announcements that should be published
  const announcements = await Announcement.find({
    isPublished: false,
    isActive: true,
    publishAt: { $lte: now },
  });

  let published = 0;

  for (const announcement of announcements) {
    await Announcement.findByIdAndUpdate(announcement._id, { isPublished: true });
    await sendAnnouncementNotifications(announcement._id.toString());
    published++;
  }

  return { success: true, published };
}

// ==================== SYSTEM NOTIFICATIONS ====================

// Send system notification to specific users
export async function sendSystemNotification(
  userIds: string[],
  title: string,
  message: string
) {
  await connectDB();

  await createBatchNotifications(userIds, {
    type: "system",
    title,
    message,
  });
}

// Send system notification to all users of a role
export async function sendSystemNotificationToRole(
  role: "admin" | "hod" | "professor" | "student",
  title: string,
  message: string
) {
  await connectDB();

  const users = await User.find({ role, isActive: true }).select("_id");
  const userIds = users.map((u) => u._id.toString());

  await createBatchNotifications(userIds, {
    type: "system",
    title,
    message,
  });
}
