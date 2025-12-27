import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubmissionFile {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface ISubmissionLink {
  title: string;
  url: string;
  addedAt: Date;
}

export interface ISubmission extends Document {
  alaId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  groupMembers?: mongoose.Types.ObjectId[];
  files: ISubmissionFile[];
  links: ISubmissionLink[];
  status: "draft" | "submitted" | "graded" | "rejected";
  marks?: number;
  feedback?: string;
  rejectionReason?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionFileSchema = new Schema<ISubmissionFile>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const SubmissionLinkSchema = new Schema<ISubmissionLink>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    alaId: {
      type: Schema.Types.ObjectId,
      ref: "ALA",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    files: { type: [SubmissionFileSchema], default: [] },
    links: { type: [SubmissionLinkSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "submitted", "graded", "rejected"],
      default: "draft",
    },
    marks: { type: Number, min: 0 },
    feedback: { type: String },
    rejectionReason: { type: String },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    gradedAt: { type: Date },
    submittedAt: { type: Date },
  },
  { timestamps: true },
);

// Indexes
SubmissionSchema.index({ alaId: 1, studentId: 1 }, { unique: true });
SubmissionSchema.index({ studentId: 1, status: 1 });
SubmissionSchema.index({ alaId: 1, status: 1 });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);
