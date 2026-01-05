import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getALAById } from "@/lib/actions/ala.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  FileText,
  Users,
  Lock,
  Unlock,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { ALAResourcesSection } from "@/components/professor/ala-resources-section";
import { GroupManagement } from "@/components/professor/group-management";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ALADetailPage({ params }: PageProps) {
  const { id } = await params;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const [dbUser, ala] = await Promise.all([
    getCurrentUserFromDB(),
    getALAById(id),
  ]);

  if (!ala) {
    notFound();
  }

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const deadline = new Date(ala.deadline);
  const isPastDeadline = deadline < new Date();

  const getStatus = () => {
    if (ala.isLocked)
      return { label: "Locked", variant: "destructive" as const };
    if (isPastDeadline)
      return { label: "Past Due", variant: "secondary" as const };
    return { label: "Active", variant: "default" as const };
  };

  const status = getStatus();

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[
        { label: "Professor", href: "/professor" },
        { label: "ALAs", href: "/professor/alas" },
        { label: ala.title },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/professor/alas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{ala.title}</h2>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {ala.subjectOfferingId?.subjectId?.code} -{" "}
              {ala.subjectOfferingId?.subjectId?.name} |{" "}
              {ala.subjectOfferingId?.classId?.name}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{ala.description}</p>
              </CardContent>
            </Card>

            <ALAResourcesSection
              alaId={ala._id}
              resources={ala.resources || []}
            />

            {ala.isGroupSubmission && ala.groupFormation === "professor" && (
              <GroupManagement
                alaId={ala._id}
                maxGroupSize={ala.maxGroupSize || 4}
              />
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-muted-foreground text-sm">
                      {deadline.toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <BookOpen className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Max Marks</p>
                    <p className="text-muted-foreground text-sm">
                      {ala.maxMarks}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Users className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Submission Type</p>
                    <p className="text-muted-foreground text-sm">
                      {ala.isGroupSubmission
                        ? `Group (max ${ala.maxGroupSize} members)`
                        : "Individual"}
                    </p>
                    {ala.isGroupSubmission && (
                      <p className="text-muted-foreground text-xs">
                        {ala.groupFormation === "professor"
                          ? "You assign groups"
                          : "Students create groups"}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Allowed Files</p>
                    <p className="text-muted-foreground text-sm uppercase">
                      {ala.allowedFileTypes?.join(", ") || "PDF"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  {ala.isLocked ? (
                    <Lock className="h-4 w-4 text-red-500" />
                  ) : (
                    <Unlock className="h-4 w-4 text-green-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-muted-foreground text-sm">
                      {ala.isLocked
                        ? "Submissions locked"
                        : "Accepting submissions"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
