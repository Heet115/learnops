"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB, User } from "@/lib/db";
import {
  createUserSchema,
  updateUserSchema,
  CreateUserInput,
  UpdateUserInput,
} from "@/lib/validations/user.validation";
import { revalidatePath } from "next/cache";

// Check if current user is admin
async function requireAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
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

    const user = await User.create({
      clerkId: clerkUser.id,
      email: validated.email,
      firstName: validated.firstName,
      lastName: validated.lastName,
      role: validated.role,
      departmentId: validated.departmentId || undefined,
      classId: validated.classId || undefined,
      profileImage: clerkUser.imageUrl,
      isActive: true,
    });

    revalidatePath("/admin/users");

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

// Get users by role
export async function getUsersByRole(role: string) {
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
