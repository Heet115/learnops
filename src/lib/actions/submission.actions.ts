"use server";

import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import {
  connectDB,
  User,
  ALA,
  Submission,
  SubjectOffering,
  Group,
} from "@/lib/db";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { logActivity } from "./activity.actions";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function requireStudent() {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "student") {
    throw new Error("Unauthorized: Student access required");
  }
  return userId;
}

async function getStudentDbUser(clerkId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true });
  if (!user) throw new Error("Student not found");
  return user;
}

// Get ALAs available for the student (based on their class)
export async function getStudentALAs() {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  if (!student.classId) {
    return [];
  }

  // Get subject offerings for student's class
  const offerings = await SubjectOffering.find({
    classId: student.classId,
    isActive: true,
  }).select("_id");

  const offeringIds = offerings.map((o) => o._id);

  // Get ALAs for those offerings
  const alas = await ALA.find({
    subjectOfferingId: { $in: offeringIds },
    isActive: true,
  })
    .populate({
      path: "subjectOfferingId",
      select: "subjectId classId",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name" },
      ],
    })
    .populate("professorId", "firstName lastName")
    .sort({ deadline: 1 })
    .lean();

  // Get student's own submissions
  const alaIds = alas.map((a) => a._id);
  const ownSubmissions = await Submission.find({
    alaId: { $in: alaIds },
    studentId: student._id,
  })
    .select(
      "alaId status marks adjustedMarks isLate latePenaltyApplied submittedAt",
    )
    .lean();

  // Get submissions where student is a group member
  const groupSubmissions = await Submission.find({
    alaId: { $in: alaIds },
    groupMembers: student._id,
  })
    .select(
      "alaId status marks adjustedMarks isLate latePenaltyApplied submittedAt",
    )
    .lean();

  // Merge submissions - prefer own submission, fallback to group submission
  const submissionMap = new Map<string, (typeof ownSubmissions)[0]>();

  // Add group submissions first
  groupSubmissions.forEach((s) => {
    submissionMap.set(s.alaId.toString(), s);
  });

  // Override with own submissions (if student is the primary submitter)
  ownSubmissions.forEach((s) => {
    submissionMap.set(s.alaId.toString(), s);
  });

  // Combine ALAs with submission status
  const alasWithStatus = alas.map((ala) => ({
    ...ala,
    submission: submissionMap.get(ala._id.toString()) || null,
  }));

  return JSON.parse(JSON.stringify(alasWithStatus));
}

// Get single ALA details for submission
export async function getALAForSubmission(alaId: string) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const ala = await ALA.findById(alaId)
    .populate({
      path: "subjectOfferingId",
      select: "subjectId classId",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name" },
      ],
    })
    .populate("professorId", "firstName lastName email")
    .lean();

  if (!ala) return null;

  // Verify student has access (is in the right class)
  const offering = await SubjectOffering.findById(ala.subjectOfferingId);
  if (
    !offering ||
    offering.classId.toString() !== student.classId?.toString()
  ) {
    return null;
  }

  let submission = null;
  let isGroupLeader = false;
  let hasGroup = false;
  let groupId = null;

  // For group submissions, check if student is in a group and get group's submission
  if (ala.isGroupSubmission) {
    const group = await Group.findOne({
      alaId,
      "members.studentId": student._id,
      "members.status": "accepted",
    });

    if (group) {
      hasGroup = true;
      groupId = group._id.toString();

      // Check if student is the group leader
      isGroupLeader = group.leaderId?.toString() === student._id.toString();

      // If no leader assigned, the group creator can submit (they become leader on submit)
      if (
        !group.leaderId &&
        group.createdBy.toString() === student._id.toString()
      ) {
        isGroupLeader = true;
      }

      // Look for any submission from group members
      const groupMemberIds = group.members
        .filter((m: { status: string }) => m.status === "accepted")
        .map((m: { studentId: { toString: () => string } }) =>
          m.studentId.toString(),
        );

      submission = await Submission.findOne({
        alaId,
        studentId: { $in: groupMemberIds },
      }).lean();
    }
  } else {
    // Individual submission
    submission = await Submission.findOne({
      alaId,
      studentId: student._id,
    }).lean();
  }

  return JSON.parse(
    JSON.stringify({
      ala,
      submission,
      studentId: student._id.toString(),
      isGroupLeader,
      hasGroup,
      groupId,
    }),
  );
}

// Create a new submission (files already uploaded to Cloudinary)
export async function createSubmission(
  alaId: string,
  data: {
    files: { name: string; url: string; type: string; size: number }[];
    links: { title: string; url: string }[];
  },
) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const ala = await ALA.findById(alaId);
  if (!ala || !ala.isActive) {
    return { success: false, error: "ALA not found" };
  }

  // Check if locked
  if (ala.isLocked) {
    return { success: false, error: "This ALA is locked for submissions" };
  }

  const now = new Date();
  const deadline = new Date(ala.deadline);
  const isPastDeadline = deadline < now;

  // Check deadline and late submission rules
  let isLate = false;
  let latePenaltyApplied = 0;

  if (isPastDeadline) {
    // Check if late submissions are allowed
    if (!ala.allowLateSubmission) {
      return {
        success: false,
        error: "Deadline has passed and late submissions are not allowed",
      };
    }

    // Check if within late deadline
    const lateDeadline = ala.lateDeadline ? new Date(ala.lateDeadline) : null;
    if (lateDeadline && lateDeadline < now) {
      return {
        success: false,
        error: "Late submission deadline has also passed",
      };
    }

    isLate = true;
    latePenaltyApplied = ala.latePenaltyPercent || 0;
  }

  if (data.files.length === 0 && data.links.length === 0) {
    return { success: false, error: "Please add at least one file or link" };
  }

  // Check if submission already exists
  const existingSubmission = await Submission.findOne({
    alaId,
    studentId: student._id,
  });

  if (existingSubmission) {
    return {
      success: false,
      error: "Submission already exists. Use update instead.",
    };
  }

  let groupMembers: mongoose.Types.ObjectId[] = [];

  // For group submissions, verify student is in a group and is the leader
  if (ala.isGroupSubmission) {
    const group = await Group.findOne({
      alaId,
      "members.studentId": student._id,
      "members.status": "accepted",
    });

    if (!group) {
      return { success: false, error: "You must be in a group to submit" };
    }

    // Check if student is the group leader (only leader can submit)
    if (
      group.leaderId &&
      group.leaderId.toString() !== student._id.toString()
    ) {
      return {
        success: false,
        error: "Only the group leader can submit for the group",
      };
    }

    // If no leader is assigned, allow submission but warn
    if (!group.leaderId) {
      // Allow submission but the submitter becomes the de-facto leader
      await Group.findByIdAndUpdate(group._id, { leaderId: student._id });
    }

    // Check if any group member already has a submission
    const acceptedMembers = group.members.filter(
      (m: { status: string }) => m.status === "accepted",
    );
    const groupMemberIds = acceptedMembers.map(
      (m: { studentId: mongoose.Types.ObjectId }) => m.studentId,
    );

    const existingGroupSubmission = await Submission.findOne({
      alaId,
      studentId: { $in: groupMemberIds },
    });

    if (existingGroupSubmission) {
      return { success: false, error: "A group member has already submitted" };
    }

    // Get other members (exclude the submitter)
    groupMembers = groupMemberIds.filter(
      (id) => id.toString() !== student._id.toString(),
    );

    // Lock the group
    await Group.findByIdAndUpdate(group._id, { isLocked: true });
  }

  // Create submission with status "submitted"
  const submission = await Submission.create({
    alaId: new mongoose.Types.ObjectId(alaId),
    studentId: student._id,
    groupMembers,
    files: data.files.map((f) => ({ ...f, uploadedAt: new Date() })),
    links: data.links.map((l) => ({ ...l, addedAt: new Date() })),
    status: "submitted",
    isLate,
    latePenaltyApplied: isLate ? latePenaltyApplied : undefined,
    submittedAt: new Date(),
  });

  revalidatePath(`/student/alas/${alaId}`);
  revalidatePath("/student/alas");
  revalidatePath("/student/submissions");

  // Log activity
  await logActivity({
    userId: student._id.toString(),
    action: "submission_created",
    entityType: "submission",
    entityId: submission._id.toString(),
    details: {
      alaId,
      alaTitle: ala.title,
      filesCount: data.files.length,
      linksCount: data.links.length,
      isGroupSubmission: ala.isGroupSubmission,
      isLate,
      latePenaltyApplied: isLate ? latePenaltyApplied : undefined,
    },
  });

  return {
    success: true,
    submission: JSON.parse(JSON.stringify(submission)),
    isLate,
    latePenaltyApplied: isLate ? latePenaltyApplied : 0,
  };
}

// Update an existing submission
export async function updateSubmission(
  submissionId: string,
  data: {
    files: { name: string; url: string; type: string; size: number }[];
    links: { title: string; url: string }[];
    filesToDelete?: string[];
  },
) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    return { success: false, error: "Submission not found" };
  }

  const ala = await ALA.findById(submission.alaId);
  if (!ala) {
    return { success: false, error: "ALA not found" };
  }

  // For group submissions, only the leader can edit
  if (ala.isGroupSubmission) {
    const group = await Group.findOne({
      alaId: submission.alaId,
      "members.studentId": student._id,
      "members.status": "accepted",
    });

    if (!group) {
      return { success: false, error: "You are not a member of this group" };
    }

    // Check if student is the group leader
    if (
      group.leaderId &&
      group.leaderId.toString() !== student._id.toString()
    ) {
      return {
        success: false,
        error: "Only the group leader can edit the submission",
      };
    }

    // If no leader, only the original submitter can edit
    if (
      !group.leaderId &&
      submission.studentId.toString() !== student._id.toString()
    ) {
      return { success: false, error: "Only the original submitter can edit" };
    }
  } else {
    // For individual submissions, only the submitter can edit
    if (submission.studentId.toString() !== student._id.toString()) {
      return { success: false, error: "Unauthorized" };
    }
  }

  // Check if can modify
  if (submission.status === "graded") {
    return { success: false, error: "Cannot modify graded submission" };
  }

  if (ala.isLocked) {
    return { success: false, error: "This ALA is locked" };
  }

  const now = new Date();
  const deadline = new Date(ala.deadline);
  const isPastDeadline = deadline < now;

  // Check deadline and late submission rules
  let isLate = submission.isLate || false;
  let latePenaltyApplied = submission.latePenaltyApplied || 0;

  if (isPastDeadline && !submission.isLate) {
    // Original submission was on time, but update is late
    if (!ala.allowLateSubmission) {
      return {
        success: false,
        error: "Deadline has passed and late submissions are not allowed",
      };
    }

    const lateDeadline = ala.lateDeadline ? new Date(ala.lateDeadline) : null;
    if (lateDeadline && lateDeadline < now) {
      return {
        success: false,
        error: "Late submission deadline has also passed",
      };
    }

    // Mark as late since update is after deadline
    isLate = true;
    latePenaltyApplied = ala.latePenaltyPercent || 0;
  } else if (isPastDeadline && submission.isLate) {
    // Already late, check if still within late deadline
    const lateDeadline = ala.lateDeadline ? new Date(ala.lateDeadline) : null;
    if (lateDeadline && lateDeadline < now) {
      return { success: false, error: "Late submission deadline has passed" };
    }
  }

  if (data.files.length === 0 && data.links.length === 0) {
    return { success: false, error: "Please add at least one file or link" };
  }

  // Delete old files from Cloudinary
  if (data.filesToDelete && data.filesToDelete.length > 0) {
    for (const fileUrl of data.filesToDelete) {
      if (fileUrl.includes("cloudinary")) {
        await deleteFromCloudinary(fileUrl);
      }
    }
  }

  // Update submission
  const updated = await Submission.findByIdAndUpdate(
    submissionId,
    {
      files: data.files.map((f) => ({ ...f, uploadedAt: new Date() })),
      links: data.links.map((l) => ({ ...l, addedAt: new Date() })),
      status: "submitted",
      isLate,
      latePenaltyApplied: isLate ? latePenaltyApplied : undefined,
      submittedAt: new Date(),
    },
    { new: true },
  );

  revalidatePath(`/student/alas/${submission.alaId}`);
  revalidatePath("/student/alas");
  revalidatePath("/student/submissions");

  // Log activity
  await logActivity({
    userId: student._id.toString(),
    action: "submission_updated",
    entityType: "submission",
    entityId: submissionId,
    details: {
      alaId: submission.alaId.toString(),
      alaTitle: ala.title,
      filesCount: data.files.length,
      linksCount: data.links.length,
      isLate,
      latePenaltyApplied: isLate ? latePenaltyApplied : undefined,
    },
  });

  return {
    success: true,
    submission: JSON.parse(JSON.stringify(updated)),
    isLate,
    latePenaltyApplied: isLate ? latePenaltyApplied : 0,
  };
}

// Get student's submissions
export async function getStudentSubmissions() {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const submissions = await Submission.find({ studentId: student._id })
    .populate({
      path: "alaId",
      select: "title deadline maxMarks subjectOfferingId",
      populate: {
        path: "subjectOfferingId",
        select: "subjectId",
        populate: { path: "subjectId", select: "name code" },
      },
    })
    .sort({ updatedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(submissions));
}

function extractPublicIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/upload/");
    if (pathParts.length < 2) return null;
    let publicIdWithExt = pathParts[1];
    // Remove version if present (v1234567890/)
    if (publicIdWithExt.match(/^v\d+\//)) {
      publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, "");
    }
    // Remove file extension
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");
    if (lastDotIndex > 0) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    return publicIdWithExt;
  } catch {
    return null;
  }
}

async function deleteFromCloudinary(fileUrl: string): Promise<boolean> {
  const publicId = extractPublicIdFromUrl(fileUrl);
  if (!publicId) {
    console.warn("Could not extract public_id from URL:", fileUrl);
    return false;
  }

  try {
    // Try as raw first (for documents like PDF, DOCX)
    let result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    if (result.result === "ok") return true;

    // Try as image if raw didn't work
    result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (result.result === "ok") return true;

    // Try as auto
    result = await cloudinary.uploader.destroy(publicId);

    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}
