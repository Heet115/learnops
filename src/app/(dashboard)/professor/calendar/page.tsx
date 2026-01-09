import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProfessorCalendarView } from "@/components/professor/calendar-view";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { CalendarDays } from "lucide-react";

export const metadata = {
  title: "Calendar | Professor | LearnOps",
  description: "View your ALA deadlines in calendar format",
};

export default async function ProfessorCalendarPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const dbUser = await getCurrentUserFromDB();

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[
        { label: "Professor", href: "/professor" },
        { label: "Calendar" },
      ]}
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Calendar</h2>
          <p className="text-muted-foreground">
            View all your ALA deadlines across classes
          </p>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <CalendarDays className="text-primary h-4 w-4" />
              </div>
              <div>
                <CardTitle>ALA Calendar</CardTitle>
                <CardDescription>
                  Track deadlines and submissions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CalendarSkeleton />}>
              <ProfessorCalendarView />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      <Skeleton className="h-[500px] w-full rounded-lg" />
    </div>
  );
}
