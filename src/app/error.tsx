"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Animated background */}
      <div className="from-destructive/5 via-background to-muted/50 absolute inset-0 bg-linear-to-br" />
      <div className="from-destructive/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] via-transparent to-transparent" />

      {/* Floating decorative elements */}
      <div className="bg-destructive/5 absolute top-20 left-10 h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-muted/50 absolute right-10 bottom-20 h-96 w-96 rounded-full blur-3xl" />

      <div className="animate-fade-in relative z-10 w-full max-w-md">
        <Card className="border-destructive/20 bg-card/80 shadow-destructive/5 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            {/* Icon with animated ring */}
            <div className="relative mx-auto mb-3">
              <div
                className="bg-destructive/20 absolute inset-0 animate-ping rounded-full"
                style={{ animationDuration: "2s" }}
              />
              <div className="from-destructive/20 to-destructive/10 ring-destructive/20 relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br ring-1">
                <AlertTriangle className="text-destructive h-8 w-8" />
              </div>
            </div>

            <CardTitle className="text-xl font-bold tracking-tight">
              Something Went Wrong
            </CardTitle>
            <CardDescription>
              We encountered an unexpected error. Don&apos;t worry, your data is
              safe.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Info box */}
            <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-3">
              <div className="flex gap-3">
                <Bug className="text-destructive h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">
                    This might be a temporary issue. Please try again.
                  </p>
                  {error.digest && (
                    <p className="font-mono text-xs text-muted-foreground/70">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button onClick={reset} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Problem persists?{" "}
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
