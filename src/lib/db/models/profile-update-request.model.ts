import mongoose, { Schema, Document, Model } from "mongoose";

export type RequestStatus = "pending" | "approved" | "rejected";

export interface IRequestedChange {
  fieldKey: string;
  fieldLabel: string;
  currentValue: string | null;
  requestedValue: string;
}

export interface IProfileUpdateRequest extends Document {
  requestedBy: mongoose.Types.ObjectId;
  requestedChanges: IRequestedChange[];
  requestStatus: RequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewComment?: string;
  requestedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RequestedChangeSchema = new Schema<IRequestedChange>(
  {
    fieldKey: { type: String, required: true },
    fieldLabel: { type: String, required: true },
    currentValue: { type: String, default: null },
    requestedValue: { type: String, required: true },
  },
  { _id: false },
);

const ProfileUpdateRequestSchema = new Schema<IProfileUpdateRequest>(
  {
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedChanges: {
      type: [RequestedChangeSchema],
      required: true,
      validate: {
        validator: (v: IRequestedChange[]) => v.length > 0,
        message: "At least one change must be requested",
      },
    },
    requestStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewComment: { type: String, trim: true },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Indexes
ProfileUpdateRequestSchema.index({ requestedBy: 1, requestStatus: 1 });
ProfileUpdateRequestSchema.index({ requestStatus: 1, requestedAt: -1 });

export const ProfileUpdateRequest: Model<IProfileUpdateRequest> =
  mongoose.models.ProfileUpdateRequest ||
  mongoose.model<IProfileUpdateRequest>(
    "ProfileUpdateRequest",
    ProfileUpdateRequestSchema,
  );
