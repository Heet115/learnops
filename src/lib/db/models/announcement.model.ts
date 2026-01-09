import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  message: string;
  createdBy: mongoose.Types.ObjectId;
  createdByRole: "admin" | "hod" | "professor";
  // Target audience
  targetType: "all" | "department" | "class" | "subject_offering";
  targetId?: mongoose.Types.ObjectId; // departmentId, classId, or subjectOfferingId
  // Priority
  priority: "low" | "normal" | "high" | "urgent";
  // Scheduling
  publishAt?: Date;
  expiresAt?: Date;
  // Status
  isPublished: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["admin", "hod", "professor"],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["all", "department", "class", "subject_offering"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    publishAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
AnnouncementSchema.index({ targetType: 1, targetId: 1, isActive: 1 });
AnnouncementSchema.index({ createdBy: 1, createdAt: -1 });
AnnouncementSchema.index({ isPublished: 1, publishAt: 1 });

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
