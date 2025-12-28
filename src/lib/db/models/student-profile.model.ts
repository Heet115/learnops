import mongoose, { Schema, Document, Model } from "mongoose";

export type Gender = "male" | "female" | "other";
export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";
export type StudentStatus = "active" | "regular" | "detained" | "alumni";

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;

  // Identity
  studentId: string;
  enrollmentNumber?: string;
  middleName?: string;
  fatherName?: string;
  motherName?: string;
  gender?: Gender;
  dateOfBirth?: Date;
  bloodGroup?: BloodGroup;

  // Contact
  alternateEmail?: string;

  // Academic
  courseId?: mongoose.Types.ObjectId;
  batch?: string;
  academicSession?: string;
  rollNumber?: string;
  admissionDate?: Date;
  studentStatus: StudentStatus;

  // Address
  presentAddressLine1?: string;
  presentAddressLine2?: string;
  presentCity?: string;
  presentState?: string;
  presentCountry?: string;
  presentPostalCode?: string;

  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Identity
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    enrollmentNumber: { type: String, trim: true },
    middleName: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dateOfBirth: { type: Date },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    // Contact
    alternateEmail: { type: String, trim: true, lowercase: true },

    // Academic
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
    batch: { type: String, trim: true },
    academicSession: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    admissionDate: { type: Date },
    studentStatus: {
      type: String,
      enum: ["active", "regular", "detained", "alumni"],
      default: "active",
    },

    // Address
    presentAddressLine1: { type: String, trim: true },
    presentAddressLine2: { type: String, trim: true },
    presentCity: { type: String, trim: true },
    presentState: { type: String, trim: true },
    presentCountry: { type: String, trim: true },
    presentPostalCode: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

// Indexes
StudentProfileSchema.index({ enrollmentNumber: 1 });
StudentProfileSchema.index({ courseId: 1, batch: 1 });
StudentProfileSchema.index({ studentStatus: 1 });

export const StudentProfile: Model<IStudentProfile> =
  mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);
