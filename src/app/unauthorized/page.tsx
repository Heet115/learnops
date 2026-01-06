import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Access Denied
            </h1>
            <p className="text-sm text-muted-foreground">
              You don’t have permission to view this page. If this seems wrong,
              please contact your administrator.
            </p>
          </div>

          <Button asChild className="mt-2">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
