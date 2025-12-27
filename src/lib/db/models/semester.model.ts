import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISemester extends Document {
  name: string;
  number: number;
  courseId: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SemesterSchema = new Schema<ISemester>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

SemesterSchema.index({ courseId: 1, number: 1 });

export const Semester: Model<ISemester> =
  mongoose.models.Semester || mongoose.model<ISemester>('Semester', SemesterSchema);
