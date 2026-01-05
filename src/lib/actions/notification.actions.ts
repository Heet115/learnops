"use server";

import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectDB, Notification, User, ALA } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
}) {
  await connectDB();

  await Notification.create({
    userId: new mongoose.Types.ObjectId(data.userId),
    type: data.type,
    title: data.title,
    message: data.message,
    relatedId: data.relatedId
      ? new mongoose.Types.ObjectId(data.relatedId)
      : undefined,
  });
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

  const notifications = students.map((student) => ({
    userId: student._id,
    type: "new_ala" as const,
    title: "New ALA Posted",
    message: `${offering.subjectId?.code || "Subject"}: ${ala.title}`,
    relatedId: ala._id,
    relatedType: "ala" as const,
  }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
}

// Create notification for deadline reminder (24 hours before)
export async function notifyDeadlineReminder(alaId: string, studentId: string) {
  await connectDB();

  const ala = await ALA.findById(alaId).populate({
    path: "subjectOfferingId",
    select: "subjectId",
    populate: { path: "subjectId", select: "code" },
  });

  if (!ala) return;

  const offering = ala.subjectOfferingId as unknown as {
    subjectId?: { code: string };
  };

  await Notification.create({
    userId: new mongoose.Types.ObjectId(studentId),
    type: "deadline_reminder",
    title: "Deadline Approaching",
    message: `${offering.subjectId?.code || "ALA"}: "${ala.title}" is due in 24 hours`,
    relatedId: ala._id,
    relatedType: "ala",
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

  await Notification.create({
    userId: new mongoose.Types.ObjectId(studentId),
    type: "submission_graded",
    title: "Submission Graded",
    message: `Your submission for "${alaTitle}" has been graded: ${marks}/${maxMarks}`,
    relatedId: new mongoose.Types.ObjectId(submissionId),
    relatedType: "submission",
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

  await Notification.create({
    userId: new mongoose.Types.ObjectId(studentId),
    type: "submission_rejected",
    title: "Submission Rejected",
    message: `Your submission for "${alaTitle}" was rejected: ${reason}`,
    relatedId: new mongoose.Types.ObjectId(submissionId),
    relatedType: "submission",
  });
}

// Batch create deadline reminders (to be called by a cron job or scheduled task)
export async function createDeadlineReminders() {
  await connectDB();

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find ALAs with deadline in next 24 hours that aren't locked
  const alas = await ALA.find({
    deadline: { $gte: now, $lte: tomorrow },
    isLocked: false,
    isActive: true,
  }).populate({
    path: "subjectOfferingId",
    select: "classId subjectId",
    populate: { path: "subjectId", select: "code" },
  });

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

    const notifications = students
      .filter((s) => !existingSet.has(s._id.toString()))
      .map((student) => ({
        userId: student._id,
        type: "deadline_reminder" as const,
        title: "Deadline Approaching",
        message: `${offering.subjectId?.code || "ALA"}: "${ala.title}" is due in less than 24 hours`,
        relatedId: ala._id,
        relatedType: "ala" as const,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  return { success: true };
}
