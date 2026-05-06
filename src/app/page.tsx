'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
  FileText,
  Clock,
  Shield,
  ArrowRight,
} from "lucide-react";
import { ModeToggle } from "@/components/Theme/mode-toggle";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: "ALA Management",
      description:
        "Create and manage Active Learning Activities with intuitive workflows.",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description:
        "Secure portals for Admins, HODs, Professors, and Students.",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description:
        "Track performance trends and engagement with powerful visualizations.",
    },
    {
      icon: FileText,
      title: "File Submissions",
      description:
        "Support for multiple file formats with version tracking.",
    },
    {
      icon: Clock,
      title: "Deadline Tracking",
      description:
        "Automated reminders and auto-lock submissions after deadlines.",
    },
    {
      icon: Shield,
      title: "Secure & Auditable",
      description:
        "All actions logged for audit trail with secure authentication.",
    },
  ];

  const roles = [
    { name: "Admin", desc: "Full system control and management" },
    { name: "HOD", desc: "Department monitoring and oversight" },
    { name: "Professor", desc: "Create ALAs and grade submissions" },
    { name: "Student", desc: "Submit work and track progress" },
  ];

  if (!mounted) return null;

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-border/40 bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-lg bg-primary opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <span className="text-base font-semibold tracking-tight">
              LearnOps
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="#features"
              className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#roles"
              className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              For Teams
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="default">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto max-w-5xl relative">
          <div className="space-y-8 text-center">
            {/* Eyebrow */}
            <div className="text-sm font-medium text-foreground/60 uppercase tracking-widest">
              Academic Management Platform
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-tight">
              <span className="block">Learning Redefined</span>
              <span className="block text-primary mt-2">Through Active Engagement</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
              A centralized platform for managing academic activities, submissions, and performance analytics across your institution.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild className="px-8">
                <Link href="/sign-in">Get Started</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="px-8"
              >
                <Link href="#features">Explore Features</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 md:py-32 px-4 border-t border-border/40">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-16">
            {/* Section Header */}
            <div className="space-y-4 text-center">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter">
                Powerful Features
              </h2>
              <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
                Everything you need to manage academic activities effectively
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group p-8 border border-border/40 rounded-xl hover:border-primary/20 transition-all duration-300 hover:shadow-sm cursor-default"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                        <p className="text-sm text-foreground/60 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="relative py-20 md:py-32 px-4 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-16">
            {/* Section Header */}
            <div className="space-y-4 text-center">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter">
                Built for Every Role
              </h2>
              <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
                Tailored experiences for different user roles
              </p>
            </div>

            {/* Roles Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {roles.map((role, index) => (
                <div
                  key={role.name}
                  className="p-6 border border-border/40 rounded-xl hover:border-primary/20 transition-all duration-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{role.name}</h3>
                    <div className="text-2xl font-light text-primary/40">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/60">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-32 px-4 border-t border-border/40">
        <div className="container mx-auto max-w-3xl">
          <div className="space-y-8 text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter">
              Ready to Transform Your Institution?
            </h2>
            <p className="text-lg text-foreground/60">
              Join hundreds of educational institutions managing students efficiently with LearnOps
            </p>
            <Button size="lg" asChild>
              <Link href="/sign-in">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 md:py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-foreground/60">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span>LearnOps</span>
            </div>
            <p>© {new Date().getFullYear()} LearnOps. Open Source Academic Platform.</p>
            <div className="flex gap-6">
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
