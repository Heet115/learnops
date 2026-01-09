"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Pin, Clock, User, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAnnouncementsForUser } from "@/lib/actions/announcement.actions";
import { cn } from "@/lib/utils";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  isPinned: boolean;
  createdBy: { firstName: string; lastName: string; role: string };
  createdAt: string;
  expiresAt?: string;
}

const priorityColors = {
  low: "bg-slate-500/10 text-slate-600 border-slate-500/30",
  normal: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  high: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  urgent: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

export function AnnouncementsFeed() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnnouncementsForUser().then((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Megaphone className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            No announcements at this time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
            <Megaphone className="h-4 w-4 text-violet-600" />
          </div>
          <CardTitle>Announcements</CardTitle>
          <Badge variant="secondary">{announcements.length}</Badge>
        </div>
      </CardHeader>
      <ScrollArea className="h-[400px]">
        <div className="divide-y">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              className={cn(
                "hover:bg-muted/50 p-4 transition-colors",
                announcement.isPinned && "bg-amber-500/5",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {announcement.isPinned && (
                      <Pin className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <h4 className="font-medium">{announcement.title}</h4>
                    <Badge
                      variant="outline"
                      className={priorityColors[announcement.priority]}
                    >
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {announcement.content}
                  </p>
                  <div className="text-muted-foreground flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {announcement.createdBy.firstName}{" "}
                      {announcement.createdBy.lastName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(announcement.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
