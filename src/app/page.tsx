import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
  FileText,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: BookOpen,
      title: "ALA Management",
      description: "Create and manage Active Learning Activities with deadlines, resources, and submission rules.",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Secure portals for Admins, HODs, Professors, and Students with specific permissions.",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track submission rates, grades, and performance with detailed analytics and heatmaps.",
    },
    {
      icon: FileText,
      title: "File Submissions",
      description: "Support for PDF, DOCX, PPT, and ZIP files with version tracking and group submissions.",
    },
    {
      icon: Clock,
      title: "Deadline Tracking",
      description: "Automated reminders and auto-lock submissions after deadlines pass.",
    },
    {
      icon: Shield,
      title: "Secure & Auditable",
      description: "All actions logged for audit trail with secure authentication via Clerk.",
    },
  ];

  const roles = [
    { name: "Admin", desc: "Full system control, user management, academic structure" },
    { name: "HOD", desc: "Department monitoring, analytics, professor oversight" },
    { name: "Professor", desc: "Create ALAs, grade submissions, manage classes" },
    { name: "Student", desc: "Submit work, track deadlines, view grades" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">LearnOps</span>
          </div>
          <Button asChild>
            <Link href="/sign-in">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border bg-white px-4 py-1.5 text-sm shadow-sm">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Free & Open Source Academic Platform
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Active Learning Activities
            <span className="mt-2 block bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Management System
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            A centralized, role-based platform for managing academic activities,
            submissions, and grading across departments, courses, and classes.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="px-8">
              <Link href="/sign-in">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-slate-50/50">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
          {[
            { value: "4", label: "User Roles" },
            { value: "100%", label: "Free Tier" },
            { value: "30MB", label: "Max File Size" },
            { value: "24/7", label: "Available" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything You Need
          </h2>
          <p className="text-muted-foreground">
            A complete solution for managing academic activities in colleges and universities.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-slate-50/50 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Built for Everyone
            </h2>
            <p className="text-muted-foreground">
              Tailored experiences for each role in the academic hierarchy.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            {roles.map((role, index) => (
              <div
                key={role.name}
                className="flex items-start gap-4 rounded-xl border bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{role.name}</h3>
                  <p className="text-sm text-muted-foreground">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-linear-to-r from-primary to-blue-600 p-8 text-center text-white md:p-12">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="mb-6 text-white/80">
            Sign in to access your dashboard and start managing academic activities.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/sign-in">
              Sign In Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold">LearnOps</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LearnOps. Built with Next.js, React & Tailwind CSS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
