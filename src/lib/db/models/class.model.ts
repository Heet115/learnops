import mongoose, { Schema, Document } from "mongoose";

export interface IClass extends Document {
  name: string;
  semesterId: mongoose.Types.ObjectId;
  academicYear: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
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

ClassSchema.index({ semesterId: 1, academicYear: 1 });
ClassSchema.index(
  { name: 1, semesterId: 1, academicYear: 1 },
  { unique: true },
);

export const Class =
  mongoose.models.Class || mongoose.model<IClass>("Class", ClassSchema);
