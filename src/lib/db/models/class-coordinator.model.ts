import mongoose, { Schema, Document } from "mongoose";

export interface IClassCoordinator extends Document {
  classId: mongoose.Types.ObjectId;
  professorId: mongoose.Types.ObjectId;
  academicYear: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassCoordinatorSchema = new Schema<IClassCoordinator>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    professorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

// Only one coordinator per class per academic year
ClassCoordinatorSchema.index({ classId: 1, academicYear: 1 }, { unique: true });

// Index for professor queries
ClassCoordinatorSchema.index({ professorId: 1, academicYear: 1 });

export const ClassCoordinator =
  mongoose.models.ClassCoordinator ||
  mongoose.model<IClassCoordinator>("ClassCoordinator", ClassCoordinatorSchema);
