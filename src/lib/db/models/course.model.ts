import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  name: string;
  code: string;
  departmentId: mongoose.Types.ObjectId;
  duration: number;
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
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
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
