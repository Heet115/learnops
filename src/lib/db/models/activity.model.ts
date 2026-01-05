import mongoose, { Schema, Document } from "mongoose";

export type ActivityAction =
  | "user_created"
  | "user_updated"
  | "user_deactivated"
  | "user_reactivated"
  | "user_deleted"
  | "department_created"
  | "department_updated"
  | "course_created"
  | "course_updated"
  | "semester_created"
  | "semester_updated"
  | "subject_created"
  | "subject_updated"
  | "class_created"
  | "class_updated"
  | "subject_offering_created"
  | "subject_offering_updated"
  | "ala_created"
  | "ala_updated"
  | "ala_deleted"
  | "submission_created"
  | "submission_updated"
  | "submission_graded"
  | "submission_rejected"
  | "group_created"
  | "group_updated"
  | "student_assigned"
  | "professor_assigned";

export type EntityType =
  | "user"
  | "department"
  | "course"
  | "semester"
  | "subject"
  | "class"
  | "subject_offering"
  | "ala"
  | "submission"
  | "group";

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: ActivityAction;
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Compound indexes for efficient queries
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ entityType: 1, entityId: 1 });
ActivitySchema.index({ action: 1, createdAt: -1 });

export const Activity =
  (mongoose.models.Activity as mongoose.Model<IActivity>) ||
  mongoose.model<IActivity>("Activity", ActivitySchema);
