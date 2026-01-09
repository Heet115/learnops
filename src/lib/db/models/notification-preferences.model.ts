import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotificationPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  // Notification type preferences
  newAla: boolean;
  deadlineReminder: boolean;
  submissionGraded: boolean;
  submissionRejected: boolean;
  groupInvite: boolean;
  groupUpdates: boolean;
  announcements: boolean;
  systemNotifications: boolean;
  // Delivery preferences
  inApp: boolean;
  // Timing preferences
  deadlineReminderHours: number; // Hours before deadline to send reminder
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferencesSchema = new Schema<INotificationPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // Notification type preferences - all enabled by default
    newAla: {
      type: Boolean,
      default: true,
    },
    deadlineReminder: {
      type: Boolean,
      default: true,
    },
    submissionGraded: {
      type: Boolean,
      default: true,
    },
    submissionRejected: {
      type: Boolean,
      default: true,
    },
    groupInvite: {
      type: Boolean,
      default: true,
    },
    groupUpdates: {
      type: Boolean,
      default: true,
    },
    announcements: {
      type: Boolean,
      default: true,
    },
    systemNotifications: {
      type: Boolean,
      default: true,
    },
    // Delivery preferences
    inApp: {
      type: Boolean,
      default: true,
    },
    // Timing preferences
    deadlineReminderHours: {
      type: Number,
      default: 24,
      min: 1,
      max: 72,
    },
    quietHoursEnabled: {
      type: Boolean,
      default: false,
    },
    quietHoursStart: {
      type: String,
      default: "22:00",
    },
    quietHoursEnd: {
      type: String,
      default: "08:00",
    },
  },
  {
    timestamps: true,
  },
);

export const NotificationPreferences: Model<INotificationPreferences> =
  mongoose.models.NotificationPreferences ||
  mongoose.model<INotificationPreferences>(
    "NotificationPreferences",
    NotificationPreferencesSchema,
  );
