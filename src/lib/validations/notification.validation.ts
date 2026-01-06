import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  newAla: z.boolean(),
  deadlineReminder: z.boolean(),
  submissionGraded: z.boolean(),
  submissionRejected: z.boolean(),
  systemNotifications: z.boolean(),
  inApp: z.boolean(),
  deadlineReminderHours: z.number().min(1).max(72),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  quietHoursEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
});

export const updateNotificationPreferencesSchema =
  notificationPreferencesSchema.partial();

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
