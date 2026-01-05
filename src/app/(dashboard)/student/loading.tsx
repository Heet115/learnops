import { Skeleton } from "@/components/ui/skeleton";
import { StatCardGridSkeleton, ListSkeleton } from "@/components/ui/skeletons";

export default function StudentDashboardLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Skeleton */}
      <div className="bg-sidebar hidden w-64 flex-col space-y-4 border-r p-4 md:flex">
        <div className="flex items-center gap-2 px-2 py-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="animate-in fade-in space-y-6 duration-300">
          {/* Header */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>

          {/* Stat Cards */}
          <StatCardGridSkeleton count={4} />

          {/* Content Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Upcoming Deadlines */}
            <div className="bg-card rounded-xl border py-6 shadow-sm">
              <div className="flex items-center justify-between px-6 pb-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="px-6">
                <ListSkeleton count={4} showAvatar={false} />
              </div>
            </div>

            {/* Recent Grades */}
            <div className="bg-card rounded-xl border py-6 shadow-sm">
              <div className="flex items-center justify-between px-6 pb-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
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
