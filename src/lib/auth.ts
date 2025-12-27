import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "hod" | "professor" | "student";

export async function getCurrentUser() {
  const { userId, sessionClaims } = await auth();

  if (!userId) return null;

  const user = await currentUser();
  const role = (sessionClaims?.metadata as { role?: UserRole })?.role;

  return {
    clerkId: userId,
    email: user?.emailAddresses[0]?.emailAddress,
    firstName: user?.firstName,
    lastName: user?.lastName,
    profileImage: user?.imageUrl,
    role,
  };
}

export async function requireAuth() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return userId;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const role = (sessionClaims?.metadata as { role?: UserRole })?.role;

  if (!role || !allowedRoles.includes(role)) {
    redirect("/unauthorized");
  }

  return { userId, role };
}

export async function getUserRole(): Promise<UserRole | undefined> {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata as { role?: UserRole })?.role;
}

export async function getAuthSession() {
  const { userId, sessionClaims } = await auth();

  if (!userId) return null;

  return {
    userId,
    role: (sessionClaims?.metadata as { role?: UserRole })?.role,
  };
}
