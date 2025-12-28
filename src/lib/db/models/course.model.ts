import mongoose, { Schema, Document, Model } from "mongoose";

export type CourseType = "diploma" | "ug" | "pg";

export interface ICourse extends Document {
  name: string;
  code: string;
  departmentId: mongoose.Types.ObjectId;
  courseType: CourseType;
  duration: number;
  semestersPerYear: number;
  totalSemesters: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    courseType: {
      type: String,
      enum: ["diploma", "ug", "pg"],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    semestersPerYear: {
      type: Number,
      required: true,
      default: 2,
      min: 1,
      max: 3,
    },
    totalSemesters: {
      type: Number,
      required: true,
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

CourseSchema.index({ departmentId: 1 });

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);
