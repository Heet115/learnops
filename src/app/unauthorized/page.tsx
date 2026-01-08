import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldX, ArrowLeft, Home, AlertTriangle } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden px-4">
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
                <ShieldX className="text-destructive h-8 w-8" />
              </div>
            </div>

            <CardTitle className="text-xl font-bold tracking-tight">
              Access Denied
            </CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this resource
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Info box */}
            <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-3">
              <div className="flex gap-3">
                <AlertTriangle className="text-destructive h-5 w-5 shrink-0" />
                <p className="text-muted-foreground text-sm">
                  Contact your administrator if you believe this is an error.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
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
