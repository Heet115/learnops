"use server";

import { auth } from "@clerk/nextjs/server";
import { connectDB, User, IUser } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getCurrentUserFromDB(): Promise<IUser | null> {
  const { userId } = await auth();

  if (!userId) return null;

  await connectDB();

  const user = await User.findOne({ clerkId: userId, isActive: true });
  return user;
}

export async function getUserByClerkId(clerkId: string): Promise<IUser | null> {
  await connectDB();
  return User.findOne({ clerkId, isActive: true });
}

export async function getUsersByRole(role: string): Promise<IUser[]> {
  await connectDB();
  return User.find({ role, isActive: true }).sort({ createdAt: -1 });
}

export async function updateUserDepartment(
  userId: string,
  departmentId: string,
): Promise<IUser | null> {
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { departmentId },
    { new: true },
  );

  revalidatePath("/admin/users");
  return user;
}

export async function updateUserClass(
  userId: string,
  classId: string,
): Promise<IUser | null> {
  await connectDB();

  const user = await User.findByIdAndUpdate(userId, { classId }, { new: true });

  revalidatePath("/admin/users");
  return user;
}

export async function deactivateUser(userId: string): Promise<IUser | null> {
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true },
  );

  revalidatePath("/admin/users");
  return user;
}

export async function activateUser(userId: string): Promise<IUser | null> {
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: true },
    { new: true },
  );

  revalidatePath("/admin/users");
  return user;
}
