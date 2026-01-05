"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ============================================
// STAT CARD SKELETON
// ============================================
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-row items-center justify-between px-6 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <div className="space-y-2 px-6">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function StatCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// TABLE SKELETON
// ============================================
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 border-b p-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === 0 ? "w-8" : i === 1 ? "w-40" : "w-24")}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="rounded-lg border">
      {showHeader && (
        <div className="bg-muted/50 flex items-center gap-4 border-b p-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-4", i === 0 ? "w-8" : i === 1 ? "w-32" : "w-20")}
            />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

// ============================================
// LIST ITEM SKELETON
// ============================================
export function ListItemSkeleton({
  showAvatar = true,
}: {
  showAvatar?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        {showAvatar ? (
          <Skeleton className="h-10 w-10 rounded-full" />
        ) : (
          <Skeleton className="h-4 w-4 rounded" />
        )}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function ListSkeleton({
  count = 5,
  showAvatar = true,
}: {
  count?: number;
  showAvatar?: boolean;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} showAvatar={showAvatar} />
      ))}
    </div>
  );
}

// ============================================
// CARD SKELETON
// ============================================
export function CardSkeleton({
  hasHeader = true,
  hasFooter = false,
  contentLines = 3,
  children,
}: {
  hasHeader?: boolean;
  hasFooter?: boolean;
  contentLines?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      {hasHeader && (
        <div className="space-y-2 px-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      )}
      {children ? (
        children
      ) : (
        <div className="space-y-3 px-6">
          {Array.from({ length: contentLines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-4", i === contentLines - 1 ? "w-3/4" : "w-full")}
            />
          ))}
        </div>
      )}
      {hasFooter && (
        <div className="flex gap-2 px-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      )}
    </div>
  );
}

// ============================================
// DASHBOARD SKELETON
// ============================================
export function DashboardHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in space-y-6 pt-4 duration-500">
      <DashboardHeaderSkeleton />
      <StatCardGridSkeleton count={4} />
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton hasHeader contentLines={0}>
          <ListSkeleton count={4} showAvatar={false} />
        </CardSkeleton>
        <CardSkeleton hasHeader contentLines={4} />
      </div>
    </div>
  );
}

// ============================================
// FORM SKELETON
// ============================================
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      <Skeleton className="mt-6 h-10 w-full" />
    </div>
  );
}

// ============================================
// PROFILE SKELETON
// ============================================
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// ============================================
// NOTIFICATION SKELETON
// ============================================
export function NotificationItemSkeleton() {
  return (
    <div className="flex gap-3 rounded-lg p-3">
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  );
}
