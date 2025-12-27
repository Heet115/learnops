"use server";

import { auth } from "@clerk/nextjs/server";
import { connectDB, User, ALA, Submission, SubjectOffering } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

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

  // Get student's submissions for these ALAs
  const alaIds = alas.map((a) => a._id);
  const submissions = await Submission.find({
    alaId: { $in: alaIds },
    studentId: student._id,
  })
    .select("alaId status marks submittedAt")
    .lean();

  const submissionMap = new Map(
    submissions.map((s) => [s.alaId.toString(), s]),
  );

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

  // Get or create submission
  const submission = await Submission.findOne({
    alaId,
    studentId: student._id,
  }).lean();

  return JSON.parse(
    JSON.stringify({ ala, submission, studentId: student._id.toString() }),
  );
}

// Create or get draft submission
export async function getOrCreateSubmission(alaId: string) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const ala = await ALA.findById(alaId);
  if (!ala || !ala.isActive) {
    return { success: false, error: "ALA not found" };
  }

  // Check if locked or past deadline
  if (ala.isLocked) {
    return { success: false, error: "This ALA is locked for submissions" };
  }

  let submission = await Submission.findOne({
    alaId,
    studentId: student._id,
  });

  if (!submission) {
    submission = await Submission.create({
      alaId,
      studentId: student._id,
      status: "draft",
    });
  }

  return { success: true, submission: JSON.parse(JSON.stringify(submission)) };
}

// Check if submission can be modified (before deadline and not graded)
async function canModifySubmission(submission: {
  alaId: unknown;
  status: string;
}) {
  if (submission.status === "graded") return false;

  const ala = await ALA.findById(submission.alaId);
  if (!ala || ala.isLocked) return false;
  if (new Date(ala.deadline) < new Date()) return false;

  return true;
}

// Add file to submission
export async function addFileToSubmission(
  submissionId: string,
  file: { name: string; url: string; type: string; size: number },
) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const submission = await Submission.findById(submissionId);
  if (
    !submission ||
    submission.studentId.toString() !== student._id.toString()
  ) {
    return { success: false, error: "Submission not found" };
  }

  if (!(await canModifySubmission(submission))) {
    return { success: false, error: "Cannot modify this submission" };
  }

  const updated = await Submission.findByIdAndUpdate(
    submissionId,
    {
      $push: {
        files: { ...file, uploadedAt: new Date() },
      },
      // If was submitted, keep as submitted (will resubmit)
    },
    { new: true },
  );

  revalidatePath(`/student/alas/${submission.alaId}`);
  return { success: true, submission: JSON.parse(JSON.stringify(updated)) };
}

// Remove file from submission
export async function removeFileFromSubmission(
  submissionId: string,
  fileUrl: string,
) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const submission = await Submission.findById(submissionId);
  if (
    !submission ||
    submission.studentId.toString() !== student._id.toString()
  ) {
    return { success: false, error: "Submission not found" };
  }

  if (!(await canModifySubmission(submission))) {
    return { success: false, error: "Cannot modify this submission" };
  }

  // Delete from Cloudinary
  if (fileUrl.includes("cloudinary")) {
    const deleted = await deleteFromCloudinary(fileUrl);
  }

  const updated = await Submission.findByIdAndUpdate(
    submissionId,
    { $pull: { files: { url: fileUrl } } },
    { new: true },
  );

  revalidatePath(`/student/alas/${submission.alaId}`);
  return { success: true, submission: JSON.parse(JSON.stringify(updated)) };
}

// Add link to submission
export async function addLinkToSubmission(
  submissionId: string,
  link: { title: string; url: string },
) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const submission = await Submission.findById(submissionId);
  if (
    !submission ||
    submission.studentId.toString() !== student._id.toString()
  ) {
    return { success: false, error: "Submission not found" };
  }

  if (!(await canModifySubmission(submission))) {
    return { success: false, error: "Cannot modify this submission" };
  }

  const updated = await Submission.findByIdAndUpdate(
    submissionId,
    {
      $push: {
        links: { ...link, addedAt: new Date() },
      },
    },
    { new: true },
  );

  revalidatePath(`/student/alas/${submission.alaId}`);
  return { success: true, submission: JSON.parse(JSON.stringify(updated)) };
}

// Remove link from submission
export async function removeLinkFromSubmission(
  submissionId: string,
  linkUrl: string,
) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const submission = await Submission.findById(submissionId);
  if (
    !submission ||
    submission.studentId.toString() !== student._id.toString()
  ) {
    return { success: false, error: "Submission not found" };
  }

  if (!(await canModifySubmission(submission))) {
    return { success: false, error: "Cannot modify this submission" };
  }

  const updated = await Submission.findByIdAndUpdate(
    submissionId,
    { $pull: { links: { url: linkUrl } } },
    { new: true },
  );

  revalidatePath(`/student/alas/${submission.alaId}`);
  return { success: true, submission: JSON.parse(JSON.stringify(updated)) };
}

// Submit the submission (finalize)
export async function submitSubmission(submissionId: string) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const submission = await Submission.findById(submissionId);
  if (
    !submission ||
    submission.studentId.toString() !== student._id.toString()
  ) {
    return { success: false, error: "Submission not found" };
  }

  // Allow submit for draft, rejected, or resubmitting (submitted but before deadline)
  if (submission.status === "graded") {
    return { success: false, error: "Cannot modify graded submission" };
  }

  const ala = await ALA.findById(submission.alaId);
  if (!ala) {
    return { success: false, error: "ALA not found" };
  }

  if (ala.isLocked) {
    return { success: false, error: "This ALA is locked" };
  }

  if (new Date(ala.deadline) < new Date()) {
    return { success: false, error: "Deadline has passed" };
  }

  if (submission.files.length === 0 && submission.links.length === 0) {
    return { success: false, error: "Please add at least one file or link" };
  }

  const updated = await Submission.findByIdAndUpdate(
    submissionId,
    {
      status: "submitted",
      submittedAt: new Date(),
    },
    { new: true },
  );

  revalidatePath(`/student/alas/${submission.alaId}`);
  revalidatePath("/student/alas");
  return { success: true, submission: JSON.parse(JSON.stringify(updated)) };
}

// Resubmit - clear old files and start fresh
export async function clearAndResubmit(submissionId: string) {
  const clerkId = await requireStudent();
  const student = await getStudentDbUser(clerkId!);

  const submission = await Submission.findById(submissionId);
  if (
    !submission ||
    submission.studentId.toString() !== student._id.toString()
  ) {
    return { success: false, error: "Submission not found" };
  }

  if (submission.status === "graded") {
    return { success: false, error: "Cannot modify graded submission" };
  }

  const ala = await ALA.findById(submission.alaId);
  if (!ala || ala.isLocked || new Date(ala.deadline) < new Date()) {
    return {
      success: false,
      error: "Cannot modify - deadline passed or locked",
    };
  }

  // Delete all files from Cloudinary
  for (const file of submission.files) {
    if (file.url.includes("cloudinary")) {
      const deleted = await deleteFromCloudinary(file.url);
    }
  }

  // Clear submission and reset to draft
  const updated = await Submission.findByIdAndUpdate(
    submissionId,
    {
      files: [],
      links: [],
      status: "draft",
      submittedAt: null,
    },
    { new: true },
  );

  revalidatePath(`/student/alas/${submission.alaId}`);
  return { success: true, submission: JSON.parse(JSON.stringify(updated)) };
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
