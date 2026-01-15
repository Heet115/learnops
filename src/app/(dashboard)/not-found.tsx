import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileQuestion, ArrowLeft, Search } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Animated background */}
      <div className="from-muted/30 via-background to-muted/50 absolute inset-0 bg-linear-to-br" />
      <div className="from-primary/5 absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] via-transparent to-transparent" />

      {/* Floating decorative elements */}
      <div className="bg-primary/5 absolute top-20 left-10 h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-muted/50 absolute right-10 bottom-20 h-96 w-96 rounded-full blur-3xl" />

      <div className="animate-fade-in relative z-10 w-full max-w-md">
        <Card className="border-muted bg-card/80 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            {/* Icon */}
            <div className="relative mx-auto mb-3">
              <div className="from-muted to-muted/50 ring-muted relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br ring-1">
                <FileQuestion className="text-muted-foreground h-8 w-8" />
              </div>
            </div>

            <div className="text-primary mb-2 text-5xl font-bold">404</div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Page Not Found
            </CardTitle>
            <CardDescription>
              This page doesn&apos;t exist or you don&apos;t have access to it.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Info box */}
            <div className="border-muted bg-muted/30 rounded-lg border p-3">
              <div className="flex gap-3">
                <Search className="text-muted-foreground h-5 w-5 shrink-0" />
                <p className="text-muted-foreground text-sm">
                  The resource may have been moved or deleted.
                </p>
              </div>
            </div>

            {/* Action button */}
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Need help?{" "}
          <Link
            href="mailto:admin@learnops.edu"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
