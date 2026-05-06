"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { connectDB, User, Class, Semester, Course } from "@/lib/db";
import type { UserRole } from "@/lib/db";
import {
  createUserSchema,
  updateUserSchema,
  CreateUserInput,
  UpdateUserInput,
} from "@/lib/validations/user.validation";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity.actions";
import { requireRole } from "@/lib/auth";

// Check if current user is admin
async function requireAdmin() {
  await requireRole(["admin"]);
}

// Helper to get departmentId from classId by traversing the hierarchy
async function getDepartmentIdFromClass(
  classId: string,
): Promise<string | null> {
  const classDoc = await Class.findById(classId).lean();
  if (!classDoc) return null;

  const semester = await Semester.findById(classDoc.semesterId).lean();
  if (!semester) return null;

  const course = await Course.findById(semester.courseId).lean();
  if (!course) return null;

  return course.departmentId?.toString() || null;
}

// Create a new user via Clerk + MongoDB
export async function createUser(input: CreateUserInput) {
  await requireAdmin();

  const validated = createUserSchema.parse(input);
  const clerk = await clerkClient();

  try {
    // Create user in Clerk
    const clerkUser = await clerk.users.createUser({
      emailAddress: [validated.email],
      firstName: validated.firstName,
      lastName: validated.lastName,
      password: validated.password,
      publicMetadata: {
        role: validated.role,
      },
    });

    // Connect to DB and create user
    await connectDB();

    // For students with classId, derive departmentId from class hierarchy
    let departmentId = validated.departmentId || undefined;
    if (validated.role === "student" && validated.classId && !departmentId) {
      departmentId =
        (await getDepartmentIdFromClass(validated.classId)) || undefined;
    }

    const user = await User.create({
      clerkId: clerkUser.id,
      email: validated.email,
      firstName: validated.firstName,
      lastName: validated.lastName,
      role: validated.role,
      departmentId,
      classId: validated.classId || undefined,
      profileImage: clerkUser.imageUrl,
      isActive: true,
    });

    revalidatePath("/admin/users");

    // Log activity
    await logActivity({
      action: "user_created",
      entityType: "user",
      entityId: user._id.toString(),
      details: {
        email: validated.email,
        role: validated.role,
        name: `${validated.firstName} ${validated.lastName}`,
      },
    });

    return { success: true, user: JSON.parse(JSON.stringify(user)) };
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const clerkError = error as { errors?: { message: string }[] };
    return {
      success: false,
      error: clerkError.errors?.[0]?.message || "Failed to create user",
    };
  }
}

// Get all users
export async function getAllUsers() {
  await requireAdmin();
  await connectDB();

  const users = await User.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(users));
}

// Get paginated users
export async function getPaginatedUsers(
  options: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isActive?: boolean;
  } = {},
) {
  await requireAdmin();
  await connectDB();

  const { page = 1, limit = 20, role, search, isActive } = options;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (role && role !== "all") query.role = role;
  if (typeof isActive === "boolean") query.isActive = isActive;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  return {
    users: JSON.parse(JSON.stringify(users)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get users by role
export async function getUsersByRole(role: UserRole) {
  await requireAdmin();
  await connectDB();

  const users = await User.find({ role, isActive: true })
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(users));
}

// Update user
export async function updateUser(userId: string, input: UpdateUserInput) {
  await requireAdmin();

  const validated = updateUserSchema.parse(input);
  await connectDB();

  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Update Clerk if role changed
    if (validated.role && validated.role !== user.role) {
      const clerk = await clerkClient();
      await clerk.users.updateUser(user.clerkId, {
        publicMetadata: { role: validated.role },
      });
    }

    // Update MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...validated },
      { new: true },
    );

    revalidatePath("/admin/users");

    // Log activity
    await logActivity({
      action: "user_updated",
      entityType: "user",
      entityId: userId,
      details: {
        changes: validated,
        previousRole: user.role,
      },
    });

    return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

// Deactivate user (soft delete)
export async function deactivateUser(userId: string) {
  await requireAdmin();
  await connectDB();

  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Ban user in Clerk
    const clerk = await clerkClient();
    await clerk.users.banUser(user.clerkId);

    // Deactivate in MongoDB
    await User.findByIdAndUpdate(userId, { isActive: false });

    revalidatePath("/admin/users");

    // Log activity
    await logActivity({
      action: "user_deactivated",
      entityType: "user",
      entityId: userId,
      details: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deactivating user:", error);
    return { success: false, error: "Failed to deactivate user" };
  }
}

// Reactivate user
export async function reactivateUser(userId: string) {
  await requireAdmin();
  await connectDB();

  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Unban user in Clerk
    const clerk = await clerkClient();
    await clerk.users.unbanUser(user.clerkId);

    // Reactivate in MongoDB
    await User.findByIdAndUpdate(userId, { isActive: true });

    revalidatePath("/admin/users");

    // Log activity
    await logActivity({
      action: "user_reactivated",
      entityType: "user",
      entityId: userId,
      details: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error reactivating user:", error);
    return { success: false, error: "Failed to reactivate user" };
  }
}

// Delete user permanently
export async function deleteUser(userId: string) {
  await requireAdmin();
  await connectDB();

  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Delete from Clerk
    const clerk = await clerkClient();
    await clerk.users.deleteUser(user.clerkId);

    // Delete from MongoDB
    await User.findByIdAndDelete(userId);

    revalidatePath("/admin/users");

    // Log activity
    await logActivity({
      action: "user_deleted",
      entityType: "user",
      entityId: userId,
      details: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

// Get user stats
export async function getUserStats() {
  await requireAdmin();
  await connectDB();

  const [total, admins, hods, professors, students, inactive] =
    await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "admin", isActive: true }),
      User.countDocuments({ role: "hod", isActive: true }),
      User.countDocuments({ role: "professor", isActive: true }),
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ isActive: false }),
    ]);

  return { total, admins, hods, professors, students, inactive };
}

// Bulk deactivate users
export async function bulkDeactivateUsers(userIds: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length === 0) {
      return { success: false, error: "No users found" };
    }

    const clerk = await clerkClient();
    let successCount = 0;

    for (const user of users) {
      try {
        await clerk.users.banUser(user.clerkId);
        await User.findByIdAndUpdate(user._id, { isActive: false });
        successCount++;
      } catch (error) {
        console.error(`Failed to deactivate user ${user._id}:`, error);
      }
    }

    revalidatePath("/admin/users");
    return { success: true, count: successCount };
  } catch (error) {
    console.error("Error bulk deactivating users:", error);
    return { success: false, error: "Failed to deactivate users" };
  }
}

// Bulk reactivate users
export async function bulkReactivateUsers(userIds: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length === 0) {
      return { success: false, error: "No users found" };
    }

    const clerk = await clerkClient();
    let successCount = 0;

    for (const user of users) {
      try {
        await clerk.users.unbanUser(user.clerkId);
        await User.findByIdAndUpdate(user._id, { isActive: true });
        successCount++;
      } catch (error) {
        console.error(`Failed to reactivate user ${user._id}:`, error);
      }
    }

    revalidatePath("/admin/users");
    return { success: true, count: successCount };
  } catch (error) {
    console.error("Error bulk reactivating users:", error);
    return { success: false, error: "Failed to reactivate users" };
  }
}

// Bulk delete users
export async function bulkDeleteUsers(userIds: string[]) {
  await requireAdmin();
  await connectDB();

  try {
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length === 0) {
      return { success: false, error: "No users found" };
    }

    const clerk = await clerkClient();
    let successCount = 0;

    for (const user of users) {
      try {
        await clerk.users.deleteUser(user.clerkId);
        await User.findByIdAndDelete(user._id);
        successCount++;
      } catch (error) {
        console.error(`Failed to delete user ${user._id}:`, error);
      }
    }

    revalidatePath("/admin/users");
    return { success: true, count: successCount };
  } catch (error) {
    console.error("Error bulk deleting users:", error);
    return { success: false, error: "Failed to delete users" };
  }
}
