"use client";

import { useState } from "react";
import { AlertCircle, Send, Inbox } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProfessorAnnouncementsList } from "./announcements-list";
import { StudentAnnouncementsList } from "@/components/student/announcements-list";
import type { AnnouncementData } from "@/components/ui/announcement-card";

interface ProfessorAnnouncementsPageContentProps {
  myAnnouncements: AnnouncementData[];
  receivedAnnouncements: AnnouncementData[];
  error: string | null;
}

export function ProfessorAnnouncementsPageContent({
  myAnnouncements,
  receivedAnnouncements,
  error,
}: ProfessorAnnouncementsPageContentProps) {
  const [activeTab, setActiveTab] = useState("received");

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="received" className="gap-2">
            <Inbox className="h-4 w-4" />
            Received
            <Badge variant="secondary" className="ml-1">
              {receivedAnnouncements.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="created" className="gap-2">
            <Send className="h-4 w-4" />
            Created
            <Badge variant="secondary" className="ml-1">
              {myAnnouncements.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          <StudentAnnouncementsList announcements={receivedAnnouncements} />
        </TabsContent>

        <TabsContent value="created" className="mt-6">
          <ProfessorAnnouncementsList announcements={myAnnouncements} />
        </TabsContent>
      </Tabs>
    </>
  );
}
