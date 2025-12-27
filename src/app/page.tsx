import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Users, BarChart3 } from 'lucide-react';

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">LearnOps</span>
          </div>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Active Learning Activities
            <span className="text-primary block">Management System</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            A centralized platform for managing academic activities, submissions, 
            and grading across departments, courses, and classes.
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-in">Get Started</Link>
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <BookOpen className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Manage ALAs</h3>
            <p className="text-muted-foreground text-sm">
              Create, assign, and track Active Learning Activities with deadlines and resources.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Users className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Role-Based Access</h3>
            <p className="text-muted-foreground text-sm">
              Secure access for Admins, HODs, Professors, and Students with specific permissions.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <BarChart3 className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Analytics</h3>
            <p className="text-muted-foreground text-sm">
              Track submission rates, grades, and performance with detailed analytics.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
