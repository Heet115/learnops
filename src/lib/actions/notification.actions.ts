"use server";

import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectDB, Notification, User, ALA } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { pushNotificationToUser } from "@/lib/sse";
import { shouldNotify } from "./notification-preferences.actions";

// Get current user's notifications
export async function getNotifications(limit = 20) {
  const { userId } = await auth();
  if (!userId) return [];

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return [];

  const notifications = await Notification.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return JSON.parse(JSON.stringify(notifications));
}

// Get unread notification count
export async function getUnreadCount() {
  const { userId } = await auth();
  if (!userId) return 0;

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return 0;

  const count = await Notification.countDocuments({
    userId: user._id,
    isRead: false,
  });

  return count;
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
    { isRead: true },
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
    { isRead: true },
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

// ==================== NOTIFICATION CREATORS ====================

// Generic create notification (for internal use)
export async function createNotification(data: {
  userId: string;
  type:
    | "new_ala"
    | "deadline_reminder"
    | "submission_graded"
    | "submission_rejected"
    | "system";
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: "ala" | "submission";
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

// Create notification for new ALA (notify all students in the class)
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

  // Create notifications respecting preferences
  for (const student of students) {
    const studentId = student._id.toString();
    const shouldSend = await shouldNotify(studentId, "new_ala");

    if (shouldSend) {
      const notification = await Notification.create({
        userId: student._id,
        type: "new_ala",
        title: "New ALA Posted",
        message: `${offering.subjectId?.code || "Subject"}: ${ala.title}`,
        relatedId: ala._id,
        relatedType: "ala",
      });

      // Push real-time
      await pushNotificationToUser(studentId, {
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
  }
}

// Create notification for deadline reminder (24 hours before)
export async function notifyDeadlineReminder(alaId: string, studentId: string) {
  await connectDB();

  // Check preferences
  const shouldSend = await shouldNotify(studentId, "deadline_reminder");
  if (!shouldSend) return;

  const ala = await ALA.findById(alaId).populate({
    path: "subjectOfferingId",
    select: "subjectId",
    populate: { path: "subjectId", select: "code" },
  });

  if (!ala) return;

  const offering = ala.subjectOfferingId as unknown as {
    subjectId?: { code: string };
  };

  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(studentId),
    type: "deadline_reminder",
    title: "Deadline Approaching",
    message: `${offering.subjectId?.code || "ALA"}: "${ala.title}" is due in 24 hours`,
    relatedId: ala._id,
    relatedType: "ala",
  });

  // Push real-time
  await pushNotificationToUser(studentId, {
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

// Create notification when submission is graded
export async function notifySubmissionGraded(
  submissionId: string,
  studentId: string,
  alaTitle: string,
  marks: number,
  maxMarks: number,
) {
  await connectDB();

  // Check preferences
  const shouldSend = await shouldNotify(studentId, "submission_graded");
  if (!shouldSend) return;

  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(studentId),
    type: "submission_graded",
    title: "Submission Graded",
    message: `Your submission for "${alaTitle}" has been graded: ${marks}/${maxMarks}`,
    relatedId: new mongoose.Types.ObjectId(submissionId),
    relatedType: "submission",
  });

  // Push real-time
  await pushNotificationToUser(studentId, {
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

// Create notification when submission is rejected
export async function notifySubmissionRejected(
  submissionId: string,
  studentId: string,
  alaTitle: string,
  reason: string,
) {
  await connectDB();

  // Check preferences
  const shouldSend = await shouldNotify(studentId, "submission_rejected");
  if (!shouldSend) return;

  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(studentId),
    type: "submission_rejected",
    title: "Submission Rejected",
    message: `Your submission for "${alaTitle}" was rejected: ${reason}`,
    relatedId: new mongoose.Types.ObjectId(submissionId),
    relatedType: "submission",
  });

  // Push real-time
  await pushNotificationToUser(studentId, {
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

// Batch create deadline reminders (to be called by a cron job or scheduled task)
export async function createDeadlineReminders() {
  await connectDB();

  const now = new Date();

  // Find ALAs with deadline in next 72 hours that aren't locked
  // We check 72 hours to accommodate different user preferences (6-72 hours)
  const maxHours = 72;
  const futureLimit = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

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

  for (const ala of alas) {
    const offering = ala.subjectOfferingId as unknown as {
      classId: mongoose.Types.ObjectId;
      subjectId?: { code: string };
    };

    // Get students who haven't submitted yet
    const { Submission } = await import("@/lib/db");
    const submittedStudentIds = await Submission.find({
      alaId: ala._id,
      status: { $in: ["submitted", "graded"] },
    }).distinct("studentId");

    const students = await User.find({
      role: "student",
      classId: offering.classId,
      isActive: true,
      _id: { $nin: submittedStudentIds },
    }).select("_id");

    // Check if reminder already sent today
    const existingReminders = await Notification.find({
      relatedId: ala._id,
      type: "deadline_reminder",
      createdAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) },
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
        // Check if user wants deadline reminders
        const shouldSend = await shouldNotify(studentId, "deadline_reminder");

        if (shouldSend) {
          const hoursLeft = Math.round(
            (deadlineTime - now.getTime()) / (60 * 60 * 1000),
          );
          const timeMessage =
            hoursLeft <= 1
              ? "less than an hour"
              : hoursLeft < 24
                ? `${hoursLeft} hours`
                : `${Math.round(hoursLeft / 24)} day(s)`;

          const notification = await Notification.create({
            userId: student._id,
            type: "deadline_reminder",
            title: "Deadline Approaching",
            message: `${offering.subjectId?.code || "ALA"}: "${ala.title}" is due in ${timeMessage}`,
            relatedId: ala._id,
            relatedType: "ala",
          });

          // Push real-time
          await pushNotificationToUser(studentId, {
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
      }
    }
  }

  return { success: true };
}
