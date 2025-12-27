import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, BarChart3 } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-primary h-8 w-8" />
            <span className="text-xl font-bold">LearnOps</span>
          </div>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Active Learning Activities
            <span className="text-primary block">Management System</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            A centralized platform for managing academic activities,
            submissions, and grading across departments, courses, and classes.
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-in">Get Started</Link>
          </Button>
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <BookOpen className="text-primary mb-4 h-10 w-10" />
            <h3 className="mb-2 text-lg font-semibold">Manage ALAs</h3>
            <p className="text-muted-foreground text-sm">
              Create, assign, and track Active Learning Activities with
              deadlines and resources.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <Users className="text-primary mb-4 h-10 w-10" />
            <h3 className="mb-2 text-lg font-semibold">Role-Based Access</h3>
            <p className="text-muted-foreground text-sm">
              Secure access for Admins, HODs, Professors, and Students with
              specific permissions.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <BarChart3 className="text-primary mb-4 h-10 w-10" />
            <h3 className="mb-2 text-lg font-semibold">Analytics</h3>
            <p className="text-muted-foreground text-sm">
              Track submission rates, grades, and performance with detailed
              analytics.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
