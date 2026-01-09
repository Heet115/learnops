import mongoose, { Schema, Document, Model } from "mongoose";

export interface IALAResource {
  name: string;
  url: string;
  type: string;
  uploadedAt: Date;
}

export interface IALA extends Document {
  title: string;
  description: string;
  subjectOfferingId: mongoose.Types.ObjectId;
  professorId: mongoose.Types.ObjectId;
  deadline: Date;
  // Late submission support
  allowLateSubmission: boolean;
  lateDeadline?: Date;
  latePenaltyPercent?: number; // Percentage deducted from marks
  maxMarks: number;
  isGroupSubmission: boolean;
  groupFormation?: "student" | "professor";
  maxGroupSize?: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  resources: IALAResource[];
  isLocked: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ALAResourceSchema = new Schema<IALAResource>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ALASchema = new Schema<IALA>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    subjectOfferingId: {
      type: Schema.Types.ObjectId,
      ref: "SubjectOffering",
      required: true,
    },
    professorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deadline: { type: Date, required: true },
    // Late submission support
    allowLateSubmission: { type: Boolean, default: false },
    lateDeadline: { type: Date },
    latePenaltyPercent: { type: Number, min: 0, max: 100, default: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    isGroupSubmission: { type: Boolean, default: false },
    groupFormation: {
      type: String,
      enum: ["student", "professor"],
    },
    maxGroupSize: { type: Number, min: 2 },
    allowedFileTypes: {
      type: [String],
      default: ["pdf", "docx", "ppt", "pptx", "zip"],
    },
    maxFileSize: { type: Number, default: 30 * 1024 * 1024 }, // 30MB
    resources: { type: [ALAResourceSchema], default: [] },
    isLocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Index for efficient queries
ALASchema.index({ subjectOfferingId: 1 });
ALASchema.index({ professorId: 1, deadline: 1 });
ALASchema.index({ deadline: 1, isLocked: 1 });

export const ALA: Model<IALA> =
  mongoose.models.ALA || mongoose.model<IALA>("ALA", ALASchema);
