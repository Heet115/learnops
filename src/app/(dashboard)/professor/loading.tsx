import { Skeleton } from "@/components/ui/skeleton";
import {
  StatCardGridSkeleton,
  ListSkeleton,
} from "@/components/ui/skeletons";

export default function ProfessorDashboardLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-64 flex-col border-r bg-sidebar p-4 space-y-4">
        <div className="flex items-center gap-2 px-2 py-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Stat Cards */}
          <StatCardGridSkeleton count={4} />

          {/* Content Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Your Subjects */}
            <div className="bg-card rounded-xl border py-6 shadow-sm">
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
              <div className="px-6">
                <ListSkeleton count={3} showAvatar={false} />
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-card rounded-xl border py-6 shadow-sm">
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="px-6">
                <ListSkeleton count={4} showAvatar={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
