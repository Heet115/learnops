"use server";

import mongoose from "mongoose";
import { connectDB, User, ALA, Group } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

// ============ HELPER FUNCTIONS ============

async function requireProfessor() {
  const { userId } = await requireRole(["professor"]);
  return userId;
}

async function requireStudent() {
  const { userId } = await requireRole(["student"]);
  return userId;
}

async function getUserDbId(clerkId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId, isActive: true });
  if (!user) throw new Error("User not found");
  return { id: user._id.toString(), user };
}

// ============ PROFESSOR GROUP ACTIONS ============

// Get students in a class for group assignment
export async function getStudentsForGroupAssignment(alaId: string) {
  const clerkId = await requireProfessor();
  const { id: professorId } = await getUserDbId(clerkId!);

  const ala = await ALA.findById(alaId).populate("subjectOfferingId");
  if (!ala || ala.professorId.toString() !== professorId) {
    return { success: false, error: "ALA not found or unauthorized" };
  }

  const offering = ala.subjectOfferingId as unknown as { classId: string };
  const students = await User.find({
    classId: offering.classId,
    role: "student",
    isActive: true,
  })
    .select("_id firstName lastName email")
    .sort({ firstName: 1 })
    .lean();

  // Get existing groups for this ALA
  const groups = await Group.find({ alaId })
    .populate("members.studentId", "firstName lastName email")
    .populate("leaderId", "firstName lastName")
    .lean();

  // Get assigned student IDs
  const assignedStudentIds = new Set<string>();
  groups.forEach((g) => {
    g.members.forEach((m) => {
      assignedStudentIds.add(m.studentId._id.toString());
    });
  });

  return {
    success: true,
    students: JSON.parse(JSON.stringify(students)),
    groups: JSON.parse(JSON.stringify(groups)),
    assignedStudentIds: Array.from(assignedStudentIds),
  };
}

// Professor creates a group and assigns students
export async function createGroupByProfessor(
  alaId: string,
  data: { name: string; studentIds: string[] },
) {
  const clerkId = await requireProfessor();
  const { id: professorId } = await getUserDbId(clerkId!);

  const ala = await ALA.findById(alaId);
  if (!ala || ala.professorId.toString() !== professorId) {
    return { success: false, error: "ALA not found or unauthorized" };
  }

  if (!ala.isGroupSubmission || ala.groupFormation !== "professor") {
    return {
      success: false,
      error: "This ALA doesn't allow professor-assigned groups",
    };
  }

  if (data.studentIds.length < 2) {
    return { success: false, error: "Group must have at least 2 members" };
  }

  if (ala.maxGroupSize && data.studentIds.length > ala.maxGroupSize) {
    return {
      success: false,
      error: `Group cannot exceed ${ala.maxGroupSize} members`,
    };
  }

  // Check if any student is already in a group for this ALA
  const existingGroups = await Group.find({
    alaId,
    "members.studentId": { $in: data.studentIds },
  });

  if (existingGroups.length > 0) {
    return {
      success: false,
      error: "Some students are already assigned to a group",
    };
  }

  const group = await Group.create({
    alaId,
    name: data.name,
    createdBy: professorId,
    createdByRole: "professor",
    members: data.studentIds.map((studentId) => ({
      studentId: new mongoose.Types.ObjectId(studentId),
      status: "accepted" as const,
      joinedAt: new Date(),
    })),
  });

  revalidatePath(`/professor/alas/${alaId}`);
  return { success: true, group: JSON.parse(JSON.stringify(group)) };
}

// Professor updates a group
export async function updateGroupByProfessor(
  groupId: string,
  data: { name?: string; studentIds?: string[] },
) {
  const clerkId = await requireProfessor();
  const { id: professorId } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const ala = group.alaId as unknown as {
    professorId: { toString: () => string };
    maxGroupSize?: number;
    _id: string;
  };
  if (ala.professorId.toString() !== professorId) {
    return { success: false, error: "Unauthorized" };
  }

  if (group.isLocked) {
    return { success: false, error: "Group is locked (submission made)" };
  }

  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;

  if (data.studentIds) {
    if (data.studentIds.length < 2) {
      return { success: false, error: "Group must have at least 2 members" };
    }
    if (ala.maxGroupSize && data.studentIds.length > ala.maxGroupSize) {
      return {
        success: false,
        error: `Group cannot exceed ${ala.maxGroupSize} members`,
      };
    }

    // Check if new students are already in other groups
    const existingGroups = await Group.find({
      alaId: ala._id,
      _id: { $ne: groupId },
      "members.studentId": { $in: data.studentIds },
    });

    if (existingGroups.length > 0) {
      return {
        success: false,
        error: "Some students are already in other groups",
      };
    }

    updateData.members = data.studentIds.map((studentId) => ({
      studentId: new mongoose.Types.ObjectId(studentId),
      status: "accepted" as const,
      joinedAt: new Date(),
    }));
  }

  const updated = await Group.findByIdAndUpdate(groupId, updateData, {
    new: true,
  });
  revalidatePath(`/professor/alas/${ala._id}`);
  return { success: true, group: JSON.parse(JSON.stringify(updated)) };
}

// Professor deletes a group
export async function deleteGroupByProfessor(groupId: string) {
  const clerkId = await requireProfessor();
  const { id: professorId } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const ala = group.alaId as unknown as {
    professorId: { toString: () => string };
    _id: string;
  };
  if (ala.professorId.toString() !== professorId) {
    return { success: false, error: "Unauthorized" };
  }

  if (group.isLocked) {
    return { success: false, error: "Cannot delete - group has submitted" };
  }

  await Group.findByIdAndDelete(groupId);
  revalidatePath(`/professor/alas/${ala._id}`);
  return { success: true };
}

// ============ STUDENT GROUP ACTIONS ============

// Get student's group for an ALA
export async function getStudentGroup(alaId: string) {
  const clerkId = await requireStudent();
  const { id: studentId } = await getUserDbId(clerkId!);

  const group = await Group.findOne({
    alaId,
    "members.studentId": studentId,
  })
    .populate("members.studentId", "firstName lastName email")
    .populate("createdBy", "firstName lastName")
    .populate("leaderId", "firstName lastName")
    .lean();

  return group ? JSON.parse(JSON.stringify(group)) : null;
}

// Get available classmates for group invitation
export async function getClassmatesForInvite(alaId: string) {
  const clerkId = await requireStudent();
  const { id: studentId, user } = await getUserDbId(clerkId!);

  if (!user.classId) {
    return { success: false, error: "You are not assigned to a class" };
  }

  const ala = await ALA.findById(alaId);
  if (!ala || !ala.isGroupSubmission || ala.groupFormation !== "student") {
    return {
      success: false,
      error: "This ALA doesn't allow student-created groups",
    };
  }

  // Get classmates
  const classmates = await User.find({
    classId: user.classId,
    role: "student",
    isActive: true,
    _id: { $ne: studentId },
  })
    .select("_id firstName lastName email")
    .sort({ firstName: 1 })
    .lean();

  // Get students already in groups for this ALA
  const groups = await Group.find({ alaId });
  const takenStudentIds = new Set<string>();
  groups.forEach((g) => {
    g.members.forEach((m) => {
      if (m.status !== "declined") {
        takenStudentIds.add(m.studentId.toString());
      }
    });
  });

  // Filter out taken students
  const availableClassmates = classmates.filter(
    (c) => !takenStudentIds.has(c._id.toString()),
  );

  return {
    success: true,
    classmates: JSON.parse(JSON.stringify(availableClassmates)),
    maxGroupSize: ala.maxGroupSize || 4,
  };
}

// Student creates a group and invites classmates
export async function createGroupByStudent(
  alaId: string,
  data: { name: string; inviteIds: string[] },
) {
  const clerkId = await requireStudent();
  const { id: studentId, user: creator } = await getUserDbId(clerkId!);

  const ala = await ALA.findById(alaId);
  if (!ala) {
    return { success: false, error: "ALA not found" };
  }

  if (!ala.isGroupSubmission || ala.groupFormation !== "student") {
    return {
      success: false,
      error: "This ALA doesn't allow student-created groups",
    };
  }

  if (ala.isLocked || new Date(ala.deadline) < new Date()) {
    return {
      success: false,
      error: "Cannot create group - deadline passed or locked",
    };
  }

  // Check if student is already in a group
  const existingGroup = await Group.findOne({
    alaId,
    "members.studentId": studentId,
    "members.status": { $ne: "declined" },
  });

  if (existingGroup) {
    return { success: false, error: "You are already in a group for this ALA" };
  }

  // Check total members (creator + invites)
  const totalMembers = 1 + data.inviteIds.length;
  if (totalMembers < 2) {
    return { success: false, error: "Group must have at least 2 members" };
  }
  if (ala.maxGroupSize && totalMembers > ala.maxGroupSize) {
    return {
      success: false,
      error: `Group cannot exceed ${ala.maxGroupSize} members`,
    };
  }

  // Check if invited students are available
  const takenGroups = await Group.find({
    alaId,
    "members.studentId": { $in: data.inviteIds },
    "members.status": { $ne: "declined" },
  });

  if (takenGroups.length > 0) {
    return { success: false, error: "Some students are already in groups" };
  }

  // Create group with creator as accepted, others as pending
  const members = [
    {
      studentId: new mongoose.Types.ObjectId(studentId),
      status: "accepted" as const,
      joinedAt: new Date(),
    },
    ...data.inviteIds.map((id) => ({
      studentId: new mongoose.Types.ObjectId(id),
      status: "pending" as const,
    })),
  ];

  const group = await Group.create({
    alaId,
    name: data.name,
    createdBy: studentId,
    createdByRole: "student",
    members,
  });

  // Send notifications to invited students
  const { notifyGroupInvite } =
    await import("@/lib/actions/notification.actions");
  const inviterName = `${creator.firstName} ${creator.lastName}`;
  for (const invitedId of data.inviteIds) {
    await notifyGroupInvite(
      group._id.toString(),
      invitedId,
      data.name,
      inviterName,
      ala.title,
    );
  }

  revalidatePath(`/student/alas/${alaId}`);
  return { success: true, group: JSON.parse(JSON.stringify(group)) };
}

// Student responds to group invitation
export async function respondToGroupInvite(groupId: string, accept: boolean) {
  const clerkId = await requireStudent();
  const { id: studentId, user: student } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const ala = group.alaId as unknown as {
    isLocked: boolean;
    deadline: Date;
    _id: string;
  };
  if (ala.isLocked || new Date(ala.deadline) < new Date()) {
    return {
      success: false,
      error: "Cannot respond - deadline passed or locked",
    };
  }

  // Find member entry
  const memberIndex = group.members.findIndex(
    (m) => m.studentId.toString() === studentId && m.status === "pending",
  );

  if (memberIndex === -1) {
    return { success: false, error: "No pending invitation found" };
  }

  if (accept) {
    // Check if student joined another group in the meantime
    const otherGroup = await Group.findOne({
      alaId: ala._id,
      _id: { $ne: groupId },
      "members.studentId": studentId,
      "members.status": "accepted",
    });

    if (otherGroup) {
      return { success: false, error: "You already joined another group" };
    }

    group.members[memberIndex].status = "accepted";
    group.members[memberIndex].joinedAt = new Date();

    // Notify other group members that someone joined
    const { notifyGroupJoined } =
      await import("@/lib/actions/notification.actions");
    const studentName = `${student.firstName} ${student.lastName}`;
    await notifyGroupJoined(groupId, studentName, studentId);
  } else {
    group.members[memberIndex].status = "declined";
  }

  await group.save();
  revalidatePath(`/student/alas/${ala._id}`);
  return { success: true, accepted: accept };
}

// Get pending invitations for student (only invitations TO this student, not FROM)
export async function getStudentPendingInvites() {
  const clerkId = await requireStudent();
  const { id: studentId } = await getUserDbId(clerkId!);

  const groups = await Group.find({
    members: {
      $elemMatch: {
        studentId: studentId,
        status: "pending",
      },
    },
    // Exclude groups created by this student (they sent the invite, not received)
    createdBy: { $ne: studentId },
  })
    .populate({
      path: "alaId",
      select: "title deadline subjectOfferingId",
      populate: {
        path: "subjectOfferingId",
        select: "subjectId",
        populate: { path: "subjectId", select: "name code" },
      },
    })
    .populate("createdBy", "firstName lastName")
    .populate("members.studentId", "firstName lastName")
    .populate("leaderId", "firstName lastName")
    .lean();

  // Filter to only include groups where this student's status is pending
  const pendingGroups = groups.map((g) => ({
    ...g,
    members: g.members.filter(
      (m) =>
        m.status === "accepted" || m.studentId._id.toString() === studentId,
    ),
  }));

  return JSON.parse(JSON.stringify(pendingGroups));
}

// Cancel a pending invite (by group creator or leader)
export async function cancelInvite(groupId: string, studentId: string) {
  const clerkId = await requireStudent();
  const { id: currentUserId } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Only creator or leader can cancel invites
  const isCreator = group.createdBy.toString() === currentUserId;
  const isLeader = group.leaderId?.toString() === currentUserId;

  if (!isCreator && !isLeader) {
    return {
      success: false,
      error: "Only the group creator or leader can cancel invites",
    };
  }

  if (group.isLocked) {
    return { success: false, error: "Group is locked (submission made)" };
  }

  const ala = group.alaId as unknown as {
    isLocked: boolean;
    deadline: Date;
    _id: string;
  };

  if (ala.isLocked || new Date(ala.deadline) < new Date()) {
    return {
      success: false,
      error: "Cannot cancel - deadline passed or locked",
    };
  }

  // Find the pending member
  const memberIndex = group.members.findIndex(
    (m) => m.studentId.toString() === studentId && m.status === "pending",
  );

  if (memberIndex === -1) {
    return {
      success: false,
      error: "No pending invitation found for this student",
    };
  }

  // Remove the pending member
  await Group.findByIdAndUpdate(groupId, {
    $pull: {
      members: {
        studentId: new mongoose.Types.ObjectId(studentId),
        status: "pending",
      },
    },
  });

  revalidatePath(`/student/alas/${ala._id}`);
  return { success: true };
}

// Student leaves a group
export async function leaveGroup(groupId: string) {
  const clerkId = await requireStudent();
  const { id: studentId, user: student } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const ala = group.alaId as unknown as {
    isLocked: boolean;
    deadline: Date;
    _id: string;
  };
  if (ala.isLocked || new Date(ala.deadline) < new Date()) {
    return {
      success: false,
      error: "Cannot leave - deadline passed or locked",
    };
  }

  if (group.isLocked) {
    return { success: false, error: "Cannot leave - group has submitted" };
  }

  const studentName = `${student.firstName} ${student.lastName}`;

  // Check if student is the creator
  if (group.createdBy.toString() === studentId) {
    // If creator leaves, delete the group
    await Group.findByIdAndDelete(groupId);
  } else {
    // Notify other group members that someone left
    const { notifyGroupLeft } =
      await import("@/lib/actions/notification.actions");
    await notifyGroupLeft(groupId, studentName, studentId);

    // Remove student from group
    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: { studentId } },
    });
  }

  revalidatePath(`/student/alas/${ala._id}`);
  return { success: true };
}

// Get groups for an ALA (for professor view)
export async function getALAGroups(alaId: string) {
  const clerkId = await requireProfessor();
  const { id: professorId } = await getUserDbId(clerkId!);

  const ala = await ALA.findById(alaId);
  if (!ala || ala.professorId.toString() !== professorId) {
    return { success: false, error: "ALA not found or unauthorized" };
  }

  const groups = await Group.find({ alaId })
    .populate("members.studentId", "firstName lastName email")
    .populate("createdBy", "firstName lastName")
    .populate("leaderId", "firstName lastName email")
    .sort({ createdAt: 1 })
    .lean();

  return { success: true, groups: JSON.parse(JSON.stringify(groups)) };
}

// ============ GROUP LEADER ACTIONS ============

// Professor assigns a group leader
export async function assignGroupLeader(groupId: string, studentId: string) {
  const clerkId = await requireProfessor();
  const { id: professorId } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const ala = group.alaId as unknown as {
    professorId: { toString: () => string };
    _id: string;
  };
  if (ala.professorId.toString() !== professorId) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify student is an accepted member of the group
  const isMember = group.members.some(
    (m) => m.studentId.toString() === studentId && m.status === "accepted",
  );
  if (!isMember) {
    return {
      success: false,
      error: "Student is not an accepted member of this group",
    };
  }

  const updated = await Group.findByIdAndUpdate(
    groupId,
    { leaderId: new mongoose.Types.ObjectId(studentId) },
    { new: true },
  )
    .populate("members.studentId", "firstName lastName email")
    .populate("leaderId", "firstName lastName email");

  revalidatePath(`/professor/alas/${ala._id}`);
  return { success: true, group: JSON.parse(JSON.stringify(updated)) };
}

// Student self-assigns as leader (if allowed and no leader exists)
export async function selfAssignAsLeader(groupId: string) {
  const clerkId = await requireStudent();
  const { id: studentId } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Check if student is an accepted member
  const isMember = group.members.some(
    (m) => m.studentId.toString() === studentId && m.status === "accepted",
  );
  if (!isMember) {
    return { success: false, error: "You are not a member of this group" };
  }

  // Only allow if no leader is assigned yet
  if (group.leaderId) {
    return { success: false, error: "Group already has a leader" };
  }

  const ala = group.alaId as unknown as { _id: string };

  const updated = await Group.findByIdAndUpdate(
    groupId,
    { leaderId: new mongoose.Types.ObjectId(studentId) },
    { new: true },
  )
    .populate("members.studentId", "firstName lastName email")
    .populate("leaderId", "firstName lastName email");

  revalidatePath(`/student/alas/${ala._id}`);
  return { success: true, group: JSON.parse(JSON.stringify(updated)) };
}

// Remove group leader (professor only)
export async function removeGroupLeader(groupId: string) {
  const clerkId = await requireProfessor();
  const { id: professorId } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const ala = group.alaId as unknown as {
    professorId: { toString: () => string };
    _id: string;
  };
  if (ala.professorId.toString() !== professorId) {
    return { success: false, error: "Unauthorized" };
  }

  const updated = await Group.findByIdAndUpdate(
    groupId,
    { $unset: { leaderId: 1 } },
    { new: true },
  ).populate("members.studentId", "firstName lastName email");

  revalidatePath(`/professor/alas/${ala._id}`);
  return { success: true, group: JSON.parse(JSON.stringify(updated)) };
}

// ============ GROUP LEADER MEMBER MANAGEMENT ============

// Leader invites a new member to the group (student-formed groups only)
export async function inviteMemberByLeader(groupId: string, studentId: string) {
  const clerkId = await requireStudent();
  const { id: leaderId, user } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Verify caller is the group leader
  if (!group.leaderId || group.leaderId.toString() !== leaderId) {
    return {
      success: false,
      error: "Only the group leader can invite members",
    };
  }

  // Only allow for student-formed groups
  if (group.createdByRole !== "student") {
    return { success: false, error: "Cannot modify professor-assigned groups" };
  }

  if (group.isLocked) {
    return { success: false, error: "Group is locked (submission made)" };
  }

  const ala = group.alaId as unknown as {
    isLocked: boolean;
    deadline: Date;
    maxGroupSize?: number;
    _id: string;
  };

  if (ala.isLocked || new Date(ala.deadline) < new Date()) {
    return {
      success: false,
      error: "Cannot invite - deadline passed or locked",
    };
  }

  // Check max group size
  const currentMembers = group.members.filter(
    (m) => m.status === "accepted" || m.status === "pending",
  );
  if (ala.maxGroupSize && currentMembers.length >= ala.maxGroupSize) {
    return {
      success: false,
      error: `Group cannot exceed ${ala.maxGroupSize} members`,
    };
  }

  // Check if student is already in this group
  const existingMember = group.members.find(
    (m) => m.studentId.toString() === studentId,
  );
  if (existingMember && existingMember.status !== "declined") {
    return {
      success: false,
      error: "Student is already in this group or has a pending invite",
    };
  }

  // Check if student is in another group for this ALA
  const otherGroup = await Group.findOne({
    alaId: ala._id,
    _id: { $ne: groupId },
    "members.studentId": studentId,
    "members.status": { $in: ["accepted", "pending"] },
  });

  if (otherGroup) {
    return { success: false, error: "Student is already in another group" };
  }

  // Verify student is in the same class
  const studentToInvite = await User.findById(studentId);
  if (
    !studentToInvite ||
    studentToInvite.classId?.toString() !== user.classId?.toString()
  ) {
    return { success: false, error: "Student not found or not in your class" };
  }

  // Add or update member
  if (existingMember) {
    // Update declined member to pending
    await Group.findOneAndUpdate(
      { _id: groupId, "members.studentId": studentId },
      { $set: { "members.$.status": "pending" } },
    );
  } else {
    // Add new member
    await Group.findByIdAndUpdate(groupId, {
      $push: {
        members: {
          studentId: new mongoose.Types.ObjectId(studentId),
          status: "pending",
        },
      },
    });
  }

  // Send notification to invited student
  const { notifyGroupInvite } =
    await import("@/lib/actions/notification.actions");
  const alaDoc = await ALA.findById(ala._id);
  const inviterName = `${user.firstName} ${user.lastName}`;
  await notifyGroupInvite(
    groupId,
    studentId,
    group.name,
    inviterName,
    alaDoc?.title || "ALA",
  );

  revalidatePath(`/student/alas/${ala._id}`);
  return { success: true };
}

// Leader removes a member from the group (student-formed groups only)
export async function removeMemberByLeader(groupId: string, studentId: string) {
  const clerkId = await requireStudent();
  const { id: leaderId } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Verify caller is the group leader
  if (!group.leaderId || group.leaderId.toString() !== leaderId) {
    return {
      success: false,
      error: "Only the group leader can remove members",
    };
  }

  // Only allow for student-formed groups
  if (group.createdByRole !== "student") {
    return { success: false, error: "Cannot modify professor-assigned groups" };
  }

  if (group.isLocked) {
    return { success: false, error: "Group is locked (submission made)" };
  }

  const ala = group.alaId as unknown as {
    isLocked: boolean;
    deadline: Date;
    _id: string;
  };

  if (ala.isLocked || new Date(ala.deadline) < new Date()) {
    return {
      success: false,
      error: "Cannot remove - deadline passed or locked",
    };
  }

  // Cannot remove yourself (leader)
  if (studentId === leaderId) {
    return {
      success: false,
      error:
        "Leader cannot remove themselves. Transfer leadership first or leave the group.",
    };
  }

  // Check if student is in the group
  const memberIndex = group.members.findIndex(
    (m) => m.studentId.toString() === studentId,
  );
  if (memberIndex === -1) {
    return { success: false, error: "Student is not a member of this group" };
  }

  // Remove the member
  await Group.findByIdAndUpdate(groupId, {
    $pull: { members: { studentId: new mongoose.Types.ObjectId(studentId) } },
  });

  revalidatePath(`/student/alas/${ala._id}`);
  return { success: true };
}

// Leader transfers leadership to another member
export async function transferLeadership(groupId: string, newLeaderId: string) {
  const clerkId = await requireStudent();
  const { id: currentLeaderId } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Verify caller is the current group leader
  if (!group.leaderId || group.leaderId.toString() !== currentLeaderId) {
    return {
      success: false,
      error: "Only the current leader can transfer leadership",
    };
  }

  if (group.isLocked) {
    return { success: false, error: "Group is locked (submission made)" };
  }

  const ala = group.alaId as unknown as {
    isLocked: boolean;
    deadline: Date;
    _id: string;
  };

  if (ala.isLocked || new Date(ala.deadline) < new Date()) {
    return {
      success: false,
      error: "Cannot transfer - deadline passed or locked",
    };
  }

  // Verify new leader is an accepted member
  const isMember = group.members.some(
    (m) => m.studentId.toString() === newLeaderId && m.status === "accepted",
  );
  if (!isMember) {
    return {
      success: false,
      error: "New leader must be an accepted member of the group",
    };
  }

  const updated = await Group.findByIdAndUpdate(
    groupId,
    { leaderId: new mongoose.Types.ObjectId(newLeaderId) },
    { new: true },
  )
    .populate("members.studentId", "firstName lastName email")
    .populate("leaderId", "firstName lastName email");

  revalidatePath(`/student/alas/${ala._id}`);
  return { success: true, group: JSON.parse(JSON.stringify(updated)) };
}

// Get available classmates for leader to invite
export async function getAvailableClassmatesForLeader(groupId: string) {
  const clerkId = await requireStudent();
  const { id: leaderId, user } = await getUserDbId(clerkId!);

  const group = await Group.findById(groupId).populate("alaId");
  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Verify caller is the group leader
  if (!group.leaderId || group.leaderId.toString() !== leaderId) {
    return {
      success: false,
      error: "Only the group leader can view available classmates",
    };
  }

  if (!user.classId) {
    return { success: false, error: "You are not assigned to a class" };
  }

  const ala = group.alaId as unknown as {
    _id: string;
    maxGroupSize?: number;
  };

  // Get classmates
  const classmates = await User.find({
    classId: user.classId,
    role: "student",
    isActive: true,
    _id: { $ne: leaderId },
  })
    .select("_id firstName lastName email")
    .sort({ firstName: 1 })
    .lean();

  // Get students already in groups for this ALA
  const groups = await Group.find({ alaId: ala._id });
  const takenStudentIds = new Set<string>();
  groups.forEach((g) => {
    g.members.forEach((m) => {
      if (m.status !== "declined") {
        takenStudentIds.add(m.studentId.toString());
      }
    });
  });

  // Filter out taken students
  const availableClassmates = classmates.filter(
    (c) => !takenStudentIds.has(c._id.toString()),
  );

  // Calculate remaining slots
  const currentMembers = group.members.filter(
    (m) => m.status === "accepted" || m.status === "pending",
  );
  const remainingSlots = ala.maxGroupSize
    ? ala.maxGroupSize - currentMembers.length
    : 10; // Default max if not specified

  return {
    success: true,
    classmates: JSON.parse(JSON.stringify(availableClassmates)),
    remainingSlots,
  };
}
