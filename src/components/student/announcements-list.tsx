"use client";

import { Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AnnouncementCard,
  type AnnouncementData,
} from "@/components/ui/announcement-card";

interface StudentAnnouncementsListProps {
  announcements: AnnouncementData[];
}

export function StudentAnnouncementsList({
  announcements,
}: StudentAnnouncementsListProps) {
  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Megaphone className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="mt-4 font-medium">No announcements</p>
          <p className="text-muted-foreground text-sm">
            You&apos;re all caught up! Check back later for new announcements.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement._id}
          announcement={announcement}
          canEdit={false}
          canDelete={false}
          canPin={false}
          showAuthor
        />
      ))}
    </div>
  );
}
