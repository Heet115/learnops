import mongoose, { Schema, Document } from "mongoose";

export interface ISubjectOffering extends Document {
  subjectId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  professorId: mongoose.Types.ObjectId;
  semesterId: mongoose.Types.ObjectId;
  academicYear: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectOfferingSchema = new Schema<ISubjectOffering>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
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

// Unique constraint: one professor per subject per class per semester per academic year
SubjectOfferingSchema.index(
  { subjectId: 1, classId: 1, semesterId: 1, academicYear: 1 },
  { unique: true },
);

// Index for professor queries
SubjectOfferingSchema.index({ professorId: 1, semesterId: 1, academicYear: 1 });

export const SubjectOffering =
  mongoose.models.SubjectOffering ||
  mongoose.model<ISubjectOffering>("SubjectOffering", SubjectOfferingSchema);
