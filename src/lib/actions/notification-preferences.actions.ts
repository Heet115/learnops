"use server";

import { auth } from "@clerk/nextjs/server";
import { connectDB, User, NotificationPreferences } from "@/lib/db";
import type { NotificationType } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updatePreferencesSchema = z.object({
  newAla: z.boolean().optional(),
  deadlineReminder: z.boolean().optional(),
  submissionGraded: z.boolean().optional(),
  submissionRejected: z.boolean().optional(),
  groupInvite: z.boolean().optional(),
  groupUpdates: z.boolean().optional(),
  announcements: z.boolean().optional(),
  systemNotifications: z.boolean().optional(),
  inApp: z.boolean().optional(),
  deadlineReminderHours: z.number().min(1).max(72).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// Get current user's notification preferences
export async function getNotificationPreferences() {
  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return null;

  // Get or create preferences
  let preferences = await NotificationPreferences.findOne({ userId: user._id });

  if (!preferences) {
    // Create default preferences
    preferences = await NotificationPreferences.create({
      userId: user._id,
    });
  }

  return JSON.parse(JSON.stringify(preferences));
}

// Update notification preferences
export async function updateNotificationPreferences(
  input: UpdatePreferencesInput,
) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const validated = updatePreferencesSchema.parse(input);

  await connectDB();
  const user = await User.findOne({ clerkId: userId, isActive: true });
  if (!user) return { success: false, error: "User not found" };

  try {
    const preferences = await NotificationPreferences.findOneAndUpdate(
      { userId: user._id },
      { $set: validated },
      { new: true, upsert: true },
    );

    revalidatePath("/student/notifications");
    revalidatePath("/professor/notifications");

    return {
      success: true,
      preferences: JSON.parse(JSON.stringify(preferences)),
    };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}

// Check if user should receive a specific notification type
export async function shouldNotify(
  userId: string,
  type: NotificationType,
): Promise<boolean> {
  await connectDB();

  const preferences = await NotificationPreferences.findOne({ userId });

  // If no preferences set, default to true
  if (!preferences) return true;

  // Check if in-app notifications are enabled
  if (!preferences.inApp) return false;

  // Check quiet hours
  if (preferences.quietHoursEnabled) {
    const now = new Date();
    const currentTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      if (currentTime >= start || currentTime < end) {
        return false;
      }
    } else {
      if (currentTime >= start && currentTime < end) {
        return false;
      }
    }
  }

  // Check specific notification type
  switch (type) {
    case "new_ala":
      return preferences.newAla;
    case "deadline_reminder":
      return preferences.deadlineReminder;
    case "submission_graded":
      return preferences.submissionGraded;
    case "submission_rejected":
      return preferences.submissionRejected;
    case "group_invite":
      return preferences.groupInvite;
    case "group_joined":
    case "group_left":
      return preferences.groupUpdates;
    case "announcement":
      return preferences.announcements;
    case "system":
      return preferences.systemNotifications;
    default:
      return true;
  }
}

// Get deadline reminder hours for a user
export async function getDeadlineReminderHours(
  userId: string,
): Promise<number> {
  await connectDB();

  const preferences = await NotificationPreferences.findOne({ userId });
  return preferences?.deadlineReminderHours || 24;
}
