import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { connectDB, User } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fallback: Create user if webhook hasn't fired yet
  await connectDB();
  const existingUser = await User.findOne({ clerkId: userId });
  
  if (!existingUser) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const role = (sessionClaims?.metadata as { role?: string })?.role || 'student';
      await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        role,
        profileImage: clerkUser.imageUrl,
        isActive: true,
      });
    }
  }

  return <>{children}</>;
}
