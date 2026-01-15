"use server";

import { connectDB, User, SubjectOffering } from "@/lib/db";
import { ALA } from "@/lib/db/models/ala.model";
import {
  createALASchema,
  updateALASchema,
  CreateALAInput,
  UpdateALAInput,
} from "@/lib/validations/ala.validation";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity.actions";
import { requireRole } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

async function requireProfessor() {
  const { userId } = await requireRole(["professor"]);
  return userId;
}

async function getProfessorDbId(clerkId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true });
  if (!user) throw new Error("Professor not found");
  return user._id.toString();
}

export async function createALA(input: CreateALAInput) {
  const clerkId = await requireProfessor();
  const validated = createALASchema.parse(input);
  const professorId = await getProfessorDbId(clerkId!);

  // Verify professor owns this subject offering
  const offering = await SubjectOffering.findById(validated.subjectOfferingId);
  if (!offering || offering.professorId.toString() !== professorId) {
    return {
      success: false,
      error: "You can only create ALAs for your assigned subjects",
    };
  }

  try {
    const ala = await ALA.create({
      ...validated,
      professorId,
      deadline: new Date(validated.deadline),
      // Late submission support
      allowLateSubmission: validated.allowLateSubmission || false,
      lateDeadline: validated.lateDeadline
        ? new Date(validated.lateDeadline)
        : undefined,
      latePenaltyPercent: validated.allowLateSubmission
        ? validated.latePenaltyPercent
        : undefined,
      maxFileSize: validated.maxFileSize * 1024 * 1024, // Convert MB to bytes
      groupFormation: validated.isGroupSubmission
        ? validated.groupFormation
        : undefined,
      maxGroupSize: validated.isGroupSubmission
        ? validated.maxGroupSize
        : undefined,
    });

    // Notify students about new ALA
    const { notifyNewALA } = await import("@/lib/actions/notification.actions");
    await notifyNewALA(ala._id.toString());

    // Log activity
    await logActivity({
      action: "ala_created",
      entityType: "ala",
      entityId: ala._id.toString(),
      details: {
        title: validated.title,
        subjectOfferingId: validated.subjectOfferingId,
        deadline: validated.deadline,
        isGroupSubmission: validated.isGroupSubmission,
      },
    });

    revalidatePath("/professor/alas");
    return { success: true, ala: JSON.parse(JSON.stringify(ala)) };
  } catch (error) {
    console.error("Error creating ALA:", error);
    return { success: false, error: "Failed to create ALA" };
  }
}

export async function getALAsByProfessor() {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const alas = await ALA.find({ professorId, isActive: true })
    .populate({
      path: "subjectOfferingId",
      select: "subjectId classId semesterId academicYear",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name" },
        { path: "semesterId", select: "name number" },
      ],
    })
    .sort({ deadline: 1 })
    .lean();

  return JSON.parse(JSON.stringify(alas));
}

// Get paginated ALAs for professor
export async function getPaginatedALAsByProfessor(options: {
  page?: number;
  limit?: number;
  status?: "active" | "locked" | "past" | "all";
  search?: string;
} = {}) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const { page = 1, limit = 20, status, search } = options;
  const skip = (page - 1) * limit;
  const now = new Date();

  const query: Record<string, unknown> = { professorId, isActive: true };

  if (status === "active") {
    query.isLocked = false;
    query.deadline = { $gt: now };
  } else if (status === "locked") {
    query.isLocked = true;
  } else if (status === "past") {
    query.deadline = { $lt: now };
  }

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  const [alas, total] = await Promise.all([
    ALA.find(query)
      .populate({
        path: "subjectOfferingId",
        select: "subjectId classId semesterId academicYear",
        populate: [
          { path: "subjectId", select: "name code" },
          { path: "classId", select: "name" },
          { path: "semesterId", select: "name number" },
        ],
      })
      .sort({ deadline: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ALA.countDocuments(query),
  ]);

  return {
    alas: JSON.parse(JSON.stringify(alas)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getALAById(id: string) {
  await connectDB();
  const ala = await ALA.findById(id)
    .populate({
      path: "subjectOfferingId",
      select: "subjectId classId semesterId academicYear",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name" },
        { path: "semesterId", select: "name number" },
      ],
    })
    .populate("professorId", "firstName lastName email")
    .lean();

  return ala ? JSON.parse(JSON.stringify(ala)) : null;
}

export async function updateALA(id: string, input: UpdateALAInput) {
  const clerkId = await requireProfessor();
  const validated = updateALASchema.parse(input);
  const professorId = await getProfessorDbId(clerkId!);

  // Verify ownership
  const existingALA = await ALA.findById(id);
  if (!existingALA || existingALA.professorId.toString() !== professorId) {
    return { success: false, error: "ALA not found or unauthorized" };
  }

  try {
    const updateData: Record<string, unknown> = { ...validated };
    if (validated.deadline) {
      updateData.deadline = new Date(validated.deadline);
    }
    if (validated.maxFileSize) {
      updateData.maxFileSize = validated.maxFileSize * 1024 * 1024;
    }
    if (validated.isGroupSubmission === false) {
      updateData.maxGroupSize = undefined;
      updateData.groupFormation = undefined;
    }
    // Late submission support
    if (validated.allowLateSubmission === false) {
      updateData.lateDeadline = undefined;
      updateData.latePenaltyPercent = undefined;
    }
    if (validated.lateDeadline) {
      updateData.lateDeadline = new Date(validated.lateDeadline);
    }
    // Handle null values for optional fields
    if (validated.groupFormation === null) {
      updateData.groupFormation = undefined;
    }
    if (validated.maxGroupSize === null) {
      updateData.maxGroupSize = undefined;
    }
    if (validated.lateDeadline === null) {
      updateData.lateDeadline = undefined;
    }

    const ala = await ALA.findByIdAndUpdate(id, updateData, { new: true });

    // Log activity
    await logActivity({
      action: "ala_updated",
      entityType: "ala",
      entityId: id,
      details: {
        title: ala?.title,
        changes: Object.keys(validated),
      },
    });

    revalidatePath("/professor/alas");
    revalidatePath(`/professor/alas/${id}`);
    return { success: true, ala: JSON.parse(JSON.stringify(ala)) };
  } catch (error) {
    console.error("Error updating ALA:", error);
    return { success: false, error: "Failed to update ALA" };
  }
}

export async function deleteALA(id: string) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const ala = await ALA.findById(id);
  if (!ala || ala.professorId.toString() !== professorId) {
    return { success: false, error: "ALA not found or unauthorized" };
  }

  // Check for submissions before deleting
  const { Submission } = await import("@/lib/db");
  const submissionsCount = await Submission.countDocuments({ alaId: id });
  if (submissionsCount > 0) {
    return {
      success: false,
      error: `Cannot delete ALA with ${submissionsCount} existing submission(s). Please delete submissions first.`,
    };
  }

  // Delete all document resources from Cloudinary
  if (ala.resources && ala.resources.length > 0) {
    for (const resource of ala.resources) {
      if (resource.type === "document" && resource.url.includes("cloudinary")) {
        await deleteFromCloudinary(resource.url);
      }
    }
  }

  await ALA.findByIdAndUpdate(id, { isActive: false });

  // Log activity
  await logActivity({
    action: "ala_deleted",
    entityType: "ala",
    entityId: id,
    details: {
      title: ala.title,
    },
  });

  revalidatePath("/professor/alas");
  return { success: true };
}

export async function toggleALALock(id: string) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const ala = await ALA.findById(id);
  if (!ala || ala.professorId.toString() !== professorId) {
    return { success: false, error: "ALA not found or unauthorized" };
  }

  const updated = await ALA.findByIdAndUpdate(
    id,
    { isLocked: !ala.isLocked },
    { new: true },
  );

  revalidatePath("/professor/alas");
  return { success: true, isLocked: updated?.isLocked };
}

export async function addResource(
  alaId: string,
  resource: { name: string; url: string; type: string },
) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const ala = await ALA.findById(alaId);
  if (!ala || ala.professorId.toString() !== professorId) {
    return { success: false, error: "ALA not found or unauthorized" };
  }

  const updated = await ALA.findByIdAndUpdate(
    alaId,
    {
      $push: {
        resources: { ...resource, uploadedAt: new Date() },
      },
    },
    { new: true },
  );

  revalidatePath(`/professor/alas/${alaId}`);
  return { success: true, ala: JSON.parse(JSON.stringify(updated)) };
}

export async function removeResource(alaId: string, resourceUrl: string) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const ala = await ALA.findById(alaId);
  if (!ala || ala.professorId.toString() !== professorId) {
    return { success: false, error: "ALA not found or unauthorized" };
  }

  // Find the resource to check if it's a document (uploaded file)
  const resource = ala.resources.find(
    (r: { url: string }) => r.url === resourceUrl,
  );

  // Delete from Cloudinary if it's an uploaded document
  if (resource?.type === "document" && resourceUrl.includes("cloudinary")) {
    await deleteFromCloudinary(resourceUrl);
  }

  const updated = await ALA.findByIdAndUpdate(
    alaId,
    { $pull: { resources: { url: resourceUrl } } },
    { new: true },
  );

  revalidatePath(`/professor/alas/${alaId}`);
  return { success: true, ala: JSON.parse(JSON.stringify(updated)) };
}

export async function getProfessorSubjectOfferings() {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const offerings = await SubjectOffering.find({ professorId, isActive: true })
    .populate("subjectId", "name code")
    .populate("classId", "name academicYear")
    .populate("semesterId", "name number")
    .sort({ academicYear: -1 })
    .lean();

  return JSON.parse(JSON.stringify(offerings));
}

// Bulk lock ALAs
export async function bulkLockALAs(ids: string[]) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  try {
    const result = await ALA.updateMany(
      { _id: { $in: ids }, professorId },
      { isLocked: true },
    );
    revalidatePath("/professor/alas");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk locking ALAs:", error);
    return { success: false, error: "Failed to lock ALAs" };
  }
}

// Bulk unlock ALAs
export async function bulkUnlockALAs(ids: string[]) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  try {
    const result = await ALA.updateMany(
      { _id: { $in: ids }, professorId },
      { isLocked: false },
    );
    revalidatePath("/professor/alas");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk unlocking ALAs:", error);
    return { success: false, error: "Failed to unlock ALAs" };
  }
}

// Bulk delete ALAs
export async function bulkDeleteALAs(ids: string[]) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  try {
    // Soft delete - set isActive to false
    const result = await ALA.updateMany(
      { _id: { $in: ids }, professorId },
      { isActive: false },
    );
    revalidatePath("/professor/alas");
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Error bulk deleting ALAs:", error);
    return { success: false, error: "Failed to delete ALAs" };
  }
}
