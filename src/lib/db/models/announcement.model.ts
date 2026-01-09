import mongoose, { Schema, Document, Model } from "mongoose";

export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";
export type AnnouncementTargetType =
  | "all"
  | "department"
  | "course"
  | "class"
  | "role";

export interface IAnnouncementTarget {
  type: AnnouncementTargetType;
  id?: mongoose.Types.ObjectId; // For department, course, class
  role?: "student" | "professor" | "hod"; // For role-based targeting
}

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  target: IAnnouncementTarget;
  priority: AnnouncementPriority;
  isPinned: boolean;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementTargetSchema = new Schema<IAnnouncementTarget>(
  {
    type: {
      type: String,
      enum: ["all", "department", "course", "class", "role"],
      required: true,
    },
    id: {
      type: Schema.Types.ObjectId,
      refPath: "target.type",
    },
    role: {
      type: String,
      enum: ["student", "professor", "hod"],
    },
  },
  { _id: false },
);

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target: {
      type: AnnouncementTargetSchema,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Indexes
AnnouncementSchema.index({ createdAt: -1 });
AnnouncementSchema.index({ "target.type": 1, "target.id": 1 });
AnnouncementSchema.index({ "target.role": 1 });
AnnouncementSchema.index({ isPinned: -1, createdAt: -1 });
AnnouncementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
