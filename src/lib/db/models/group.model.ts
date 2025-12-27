import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroupMember {
  studentId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "declined";
  joinedAt?: Date;
}

export interface IGroup extends Document {
  alaId: mongoose.Types.ObjectId;
  name: string;
  createdBy: mongoose.Types.ObjectId;
  createdByRole: "professor" | "student";
  members: IGroupMember[];
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    joinedAt: { type: Date },
  },
  { _id: false },
);

const GroupSchema = new Schema<IGroup>(
  {
    alaId: {
      type: Schema.Types.ObjectId,
      ref: "ALA",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["professor", "student"],
      required: true,
    },
    members: { type: [GroupMemberSchema], default: [] },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Indexes
GroupSchema.index({ alaId: 1 });
GroupSchema.index({ "members.studentId": 1, alaId: 1 });
GroupSchema.index({ createdBy: 1 });

export const Group: Model<IGroup> =
  mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);
