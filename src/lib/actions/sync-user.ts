"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB, User } from "@/lib/db";

/**
 * Manual sync - Use only when webhooks fail or for initial setup
 * In production, user sync is handled by Clerk Webhooks (/api/webhooks/clerk)
 */
export async function syncCurrentUser() {
  const { userId, sessionClaims } = await auth();

  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  await connectDB();

  const role =
    (sessionClaims?.metadata as { role?: string })?.role || "student";

  const user = await User.findOneAndUpdate(
    { clerkId: userId },
    {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      role,
      profileImage: clerkUser.imageUrl,
      isActive: true,
    },
    { upsert: true, new: true },
  );

  return JSON.parse(JSON.stringify(user));
}
