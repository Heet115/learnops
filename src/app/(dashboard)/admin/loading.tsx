import { Skeleton } from "@/components/ui/skeleton";
import {
  StatCardGridSkeleton,
  ListSkeleton,
  CardSkeleton,
} from "@/components/ui/skeletons";

export default function AdminDashboardLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-64 flex-col border-r bg-sidebar p-4 space-y-4">
        <div className="flex items-center gap-2 px-2 py-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
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
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stat Cards */}
          <StatCardGridSkeleton count={4} />

          {/* Content Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Users Card */}
            <div className="bg-card rounded-xl border py-6 shadow-sm">
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
              <div className="px-6">
                <ListSkeleton count={4} showAvatar={false} />
              </div>
            </div>

            {/* Activity Overview Card */}
            <CardSkeleton hasHeader contentLines={0}>
              <div className="px-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </CardSkeleton>
          </div>
        </div>
      </div>
    </div>
  );
}
