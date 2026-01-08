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
import { ModeToggle } from "@/components/Theme/mode-toggle";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: BookOpen,
      title: "ALA Management",
      description:
        "Create and manage Active Learning Activities with deadlines, resources, and submission rules.",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description:
        "Secure portals for Admins, HODs, Professors, and Students with specific permissions.",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description:
        "Track submission rates, grades, and performance with detailed analytics and heatmaps.",
    },
    {
      icon: FileText,
      title: "File Submissions",
      description:
        "Support for PDF, DOCX, PPT, and ZIP files with version tracking and group submissions.",
    },
    {
      icon: Clock,
      title: "Deadline Tracking",
      description:
        "Automated reminders and auto-lock submissions after deadlines pass.",
    },
    {
      icon: Shield,
      title: "Secure & Auditable",
      description:
        "All actions logged for audit trail with secure authentication via Clerk.",
    },
  ];

  const roles = [
    {
      name: "Admin",
      desc: "Full system control, user management, academic structure",
    },
    {
      name: "HOD",
      desc: "Department monitoring, analytics, professor oversight",
    },
    {
      name: "Professor",
      desc: "Create ALAs, grade submissions, manage classes",
    },
    { name: "Student", desc: "Submit work, track deadlines, view grades" },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-background/90 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <GraduationCap className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-xl font-bold">LearnOps</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link href="/sign-in">
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="bg-muted mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Free & Open Source Academic Platform
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Active Learning Activities
            <span className="text-primary mt-2 block">Management System</span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg md:text-xl">
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
      <section className="bg-muted/50 border-y">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
          {[
            { value: "4", label: "User Roles" },
            { value: "100%", label: "Free Tier" },
            { value: "30MB", label: "Max File Size" },
            { value: "24/7", label: "Available" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-primary text-3xl font-bold md:text-4xl">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
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
            A complete solution for managing academic activities in colleges and
            universities.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card hover:border-primary/20 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-muted/50 py-24">
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
                className="bg-card flex items-start gap-4 rounded-xl border p-6 shadow-sm"
              >
                <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{role.name}</h3>
                  <p className="text-muted-foreground text-sm">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24">
        <div className="bg-primary mx-auto max-w-3xl rounded-2xl p-8 text-center md:p-12">
          <h2 className="text-primary-foreground mb-4 text-2xl font-bold md:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 mb-6">
            Sign in to access your dashboard and start managing academic
            activities.
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
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-primary h-5 w-5" />
              <span className="font-semibold">LearnOps</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} LearnOps. Built with Next.js, React &
              Tailwind CSS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
