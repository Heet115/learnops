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
  Sparkles,
  Zap,
  Target,
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
        "Create and manage Active Learning Activities with intuitive workflows, deadlines, and submission rules.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description:
        "Secure portals for Admins, HODs, Professors, and Students with granular permissions.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description:
        "Track submission rates, performance trends, and engagement with powerful visualizations.",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: FileText,
      title: "File Submissions",
      description:
        "Support for PDF, DOCX, PPT, and ZIP files with version tracking and group submissions.",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: Clock,
      title: "Deadline Tracking",
      description:
        "Automated reminders and auto-lock submissions after deadlines, ensuring accountability.",
      color: "from-rose-500 to-rose-600",
    },
    {
      icon: Shield,
      title: "Secure & Auditable",
      description:
        "All actions logged for audit trail with secure authentication and data encryption.",
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  const roles = [
    {
      name: "Admin",
      desc: "Full system control, user management, and academic structure configuration",
      icon: "🔐",
    },
    {
      name: "HOD",
      desc: "Department monitoring, analytics review, and professor oversight capabilities",
      icon: "📊",
    },
    {
      name: "Professor",
      desc: "Create ALAs, grade submissions, manage classes, and engage students",
      icon: "👨‍🏫",
    },
    {
      name: "Student",
      desc: "Submit work, track deadlines, view feedback, and monitor progress",
      icon: "👨‍🎓",
    },
  ];

  const stats = [
    { value: "4", label: "User Roles", icon: Users },
    { value: "100%", label: "Free & Open", icon: Sparkles },
    { value: "30MB", label: "Max File Size", icon: FileText },
    { value: "24/7", label: "Always Available", icon: Zap },
  ];

  return (
    <div className="bg-background min-h-screen overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary to-primary/60 blur-sm opacity-75"></div>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight">LearnOps</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="#features"
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="#roles"
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                For Teams
              </Link>
            </nav>
            <Button asChild size="sm" className="gap-2">
              <Link href="/sign-in">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 lg:py-40">
        {/* Gradient Orbs Background */}
        <div className="absolute -top-20 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-accent/5 blur-3xl"></div>

        <div className="container relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Free & Open Source Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl md:text-7xl">
              Empower Learning Through Active Engagement
            </h1>

            {/* Subheadline */}
            <p className="mb-8 text-lg text-foreground/60 sm:text-xl md:max-w-2xl md:text-balance">
              A powerful, role-based platform for managing academic activities,
              student submissions, and performance analytics across your
              institution.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="gap-2 px-8">
                <Link href="/sign-in">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="gap-2 px-8"
              >
                <Link href="#features">Learn More</Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-col items-center justify-center gap-3 text-sm text-foreground/60">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span>Zero configuration required. Start immediately.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span>Fully audited and secure. Enterprise-ready.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/40 bg-secondary/30 px-4 py-16 md:py-20">
        <div className="container mx-auto">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="mb-3 flex justify-center">
                    <Icon className="h-8 w-8 text-primary/60" />
                  </div>
                  <div className="text-3xl font-bold md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-foreground/60">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 md:py-28">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              Everything You Need
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-foreground/60">
              Comprehensive tools for managing academic activities, student
              engagement, and institutional success.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:border-primary/20"
                >
                  {/* Gradient Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>

                  <div className="relative">
                    {/* Icon Container */}
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-colors group-hover:from-primary/20 group-hover:to-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>

                    {/* Content */}
                    <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-sm text-foreground/60 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Arrow */}
                    <ArrowRight className="mt-4 h-5 w-5 text-primary/0 transition-all group-hover:text-primary/60" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="bg-secondary/20 px-4 py-20 md:py-28">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              Built for Every Role
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-foreground/60">
              Tailored experiences designed for admins, department heads,
              professors, and students.
            </p>
          </div>

          {/* Roles Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {roles.map((role, index) => (
              <div
                key={role.name}
                className="group rounded-2xl border border-border/40 bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary/20"
              >
                {/* Top Badge */}
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
                  {role.icon}
                </div>

                {/* Role Name */}
                <h3 className="mb-2 text-lg font-semibold">{role.name}</h3>

                {/* Description */}
                <p className="text-sm text-foreground/60 leading-relaxed">
                  {role.desc}
                </p>

                {/* Divider */}
                <div className="my-4 h-px bg-border/40"></div>

                {/* Number */}
                <div className="text-xs font-medium text-primary">
                  Role {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12">
            {/* Decorative Elements */}
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl"></div>

            <div className="relative text-center">
              <Target className="mb-4 inline-block h-12 w-12 text-primary" />
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Ready to Transform Your Institution?
              </h2>
              <p className="mb-8 text-lg text-foreground/60">
                Join educational institutions managing thousands of students
                efficiently with LearnOps.
              </p>
              <Button size="lg" asChild className="gap-2 px-8">
                <Link href="/sign-in">
                  Get Started Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-4 py-8 md:py-12">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold">LearnOps</span>
            </div>
            <p className="text-sm text-foreground/60">
              © {new Date().getFullYear()} LearnOps. Built with Next.js, React,
              and Tailwind CSS.
            </p>
            <div className="flex gap-4 text-sm text-foreground/60">
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
