import { Suspense } from "react";
import { CalendarView } from "@/components/student/calendar-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Calendar | LearnOps",
  description: "View your ALA deadlines in calendar format",
};

export default function StudentCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View all your ALA deadlines and submissions
        </p>
      </div>

      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarView />
      </Suspense>
    </div>
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
