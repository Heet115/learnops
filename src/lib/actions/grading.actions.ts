"use server";

import { connectDB, User, ALA, Submission } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity.actions";
import { requireRole } from "@/lib/auth";

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

// Get all submissions for professor's ALAs
export async function getProfessorSubmissions(status?: string) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  // Get professor's ALAs
  const alas = await ALA.find({ professorId, isActive: true }).select("_id");
  const alaIds = alas.map((a) => a._id);

  // Build query
  const query: Record<string, unknown> = { alaId: { $in: alaIds } };
  if (status && status !== "all") {
    query.status = status;
  }

  const submissions = await Submission.find(query)
    .populate({
      path: "alaId",
      select: "title deadline maxMarks subjectOfferingId isGroupSubmission",
      populate: {
        path: "subjectOfferingId",
        select: "subjectId classId",
        populate: [
          { path: "subjectId", select: "name code" },
          { path: "classId", select: "name" },
        ],
      },
    })
    .populate("studentId", "firstName lastName email")
    .populate("groupMembers", "firstName lastName")
    .sort({ submittedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(submissions));
}

// Get paginated submissions for professor
export async function getPaginatedProfessorSubmissions(options: {
  page?: number;
  limit?: number;
  status?: "submitted" | "graded" | "rejected" | "all";
  alaId?: string;
  search?: string;
} = {}) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const { page = 1, limit = 20, status, alaId } = options;
  const skip = (page - 1) * limit;

  // Get professor's ALAs
  const alaQuery: Record<string, unknown> = { professorId, isActive: true };
  if (alaId) alaQuery._id = alaId;
  
  const alas = await ALA.find(alaQuery).select("_id");
  const alaIds = alas.map((a) => a._id);

  // Build submission query
  const query: Record<string, unknown> = { alaId: { $in: alaIds } };
  if (status && status !== "all") query.status = status;

  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .populate({
        path: "alaId",
        select: "title deadline maxMarks subjectOfferingId isGroupSubmission",
        populate: {
          path: "subjectOfferingId",
          select: "subjectId classId",
          populate: [
            { path: "subjectId", select: "name code" },
            { path: "classId", select: "name" },
          ],
        },
      })
      .populate("studentId", "firstName lastName email")
      .populate("groupMembers", "firstName lastName")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Submission.countDocuments(query),
  ]);

  return {
    submissions: JSON.parse(JSON.stringify(submissions)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get submissions for a specific ALA
export async function getALASubmissions(alaId: string) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  // Verify professor owns this ALA
  const ala = await ALA.findById(alaId);
  if (!ala || ala.professorId.toString() !== professorId) {
    return { success: false, error: "ALA not found or unauthorized" };
  }

  const submissions = await Submission.find({ alaId })
    .populate("studentId", "firstName lastName email")
    .populate("groupMembers", "firstName lastName")
    .sort({ submittedAt: -1 })
    .lean();

  return {
    success: true,
    submissions: JSON.parse(JSON.stringify(submissions)),
    ala: JSON.parse(JSON.stringify(ala)),
  };
}

// Get single submission for grading
export async function getSubmissionForGrading(submissionId: string) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const submission = await Submission.findById(submissionId)
    .populate({
      path: "alaId",
      select:
        "title description deadline maxMarks allowedFileTypes professorId subjectOfferingId isGroupSubmission",
      populate: {
        path: "subjectOfferingId",
        select: "subjectId classId",
        populate: [
          { path: "subjectId", select: "name code" },
          { path: "classId", select: "name" },
        ],
      },
    })
    .populate("studentId", "firstName lastName email")
    .populate("groupMembers", "firstName lastName email")
    .populate("gradedBy", "firstName lastName")
    .lean();

  if (!submission) {
    return null;
  }

  // Verify professor owns this ALA
  const ala = submission.alaId as unknown as {
    professorId: { toString: () => string };
    _id: string;
  };
  if (!ala || ala.professorId.toString() !== professorId) {
    return null;
  }

  return JSON.parse(JSON.stringify(submission));
}

// Grade a submission
export async function gradeSubmission(
  submissionId: string,
  data: { marks: number; feedback?: string },
) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const submission = await Submission.findById(submissionId).populate("alaId");
  if (!submission) {
    return { success: false, error: "Submission not found" };
  }

  const ala = submission.alaId as unknown as {
    professorId: { toString: () => string };
    maxMarks: number;
    _id: string;
    title: string;
    latePenaltyPercent?: number;
  };
  if (ala.professorId.toString() !== professorId) {
    return { success: false, error: "Unauthorized" };
  }

  if (submission.status !== "submitted" && submission.status !== "graded") {
    return { success: false, error: "Cannot grade this submission" };
  }

  if (data.marks < 0 || data.marks > ala.maxMarks) {
    return {
      success: false,
      error: `Marks must be between 0 and ${ala.maxMarks}`,
    };
  }

  // Calculate adjusted marks if submission was late
  let adjustedMarks = data.marks;
  if (
    submission.isLate &&
    submission.latePenaltyApplied &&
    submission.latePenaltyApplied > 0
  ) {
    const penaltyAmount = (data.marks * submission.latePenaltyApplied) / 100;
    adjustedMarks = Math.max(
      0,
      Math.round((data.marks - penaltyAmount) * 100) / 100,
    );
  }

  const updated = await Submission.findByIdAndUpdate(
    submissionId,
    {
      status: "graded",
      marks: data.marks,
      adjustedMarks: submission.isLate ? adjustedMarks : data.marks,
      feedback: data.feedback || "",
      gradedBy: professorId,
      gradedAt: new Date(),
      rejectionReason: null,
    },
    { new: true },
  );

  // Notify student and all group members about grading
  const { notifySubmissionGraded } =
    await import("@/lib/actions/notification.actions");
  await notifySubmissionGraded(
    submissionId,
    ala.title,
    data.marks,
    ala.maxMarks,
    submission.isLate ? adjustedMarks : undefined,
  );

  revalidatePath("/professor/submissions");
  revalidatePath(`/professor/submissions/${submissionId}`);
  revalidatePath(`/professor/alas/${ala._id}`);

  // Log activity
  await logActivity({
    action: "submission_graded",
    entityType: "submission",
    entityId: submissionId,
    details: {
      alaId: ala._id,
      alaTitle: ala.title,
      studentId: submission.studentId.toString(),
      marks: data.marks,
      adjustedMarks: submission.isLate ? adjustedMarks : data.marks,
      maxMarks: ala.maxMarks,
      isLate: submission.isLate,
      latePenaltyApplied: submission.latePenaltyApplied,
    },
  });

  return {
    success: true,
    submission: JSON.parse(JSON.stringify(updated)),
    isLate: submission.isLate,
    originalMarks: data.marks,
    adjustedMarks: submission.isLate ? adjustedMarks : data.marks,
    latePenaltyApplied: submission.latePenaltyApplied || 0,
  };
}

// Reject a submission
export async function rejectSubmission(submissionId: string, reason: string) {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const submission = await Submission.findById(submissionId).populate("alaId");
  if (!submission) {
    return { success: false, error: "Submission not found" };
  }

  const ala = submission.alaId as unknown as {
    professorId: { toString: () => string };
    _id: string;
    title: string;
  };
  if (ala.professorId.toString() !== professorId) {
    return { success: false, error: "Unauthorized" };
  }

  if (submission.status !== "submitted") {
    return { success: false, error: "Can only reject submitted work" };
  }

  if (!reason.trim()) {
    return { success: false, error: "Please provide a reason for rejection" };
  }

  const updated = await Submission.findByIdAndUpdate(
    submissionId,
    {
      status: "rejected",
      rejectionReason: reason,
      marks: null,
      feedback: null,
    },
    { new: true },
  );

  // Notify student and all group members about rejection
  const { notifySubmissionRejected } =
    await import("@/lib/actions/notification.actions");
  await notifySubmissionRejected(submissionId, ala.title, reason);

  revalidatePath("/professor/submissions");
  revalidatePath(`/professor/submissions/${submissionId}`);
  revalidatePath(`/professor/alas/${ala._id}`);

  // Log activity
  await logActivity({
    action: "submission_rejected",
    entityType: "submission",
    entityId: submissionId,
    details: {
      alaId: ala._id,
      alaTitle: ala.title,
      studentId: submission.studentId.toString(),
      rejectionReason: reason,
    },
  });

  return { success: true, submission: JSON.parse(JSON.stringify(updated)) };
}

// Get grading stats for professor
export async function getProfessorGradingStats() {
  const clerkId = await requireProfessor();
  const professorId = await getProfessorDbId(clerkId!);

  const alas = await ALA.find({ professorId, isActive: true }).select("_id");
  const alaIds = alas.map((a) => a._id);

  const [pending, graded, rejected, total] = await Promise.all([
    Submission.countDocuments({ alaId: { $in: alaIds }, status: "submitted" }),
    Submission.countDocuments({ alaId: { $in: alaIds }, status: "graded" }),
    Submission.countDocuments({ alaId: { $in: alaIds }, status: "rejected" }),
    Submission.countDocuments({ alaId: { $in: alaIds } }),
  ]);

  return { pending, graded, rejected, total };
}
