import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getALAById } from "@/lib/actions/ala.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Info,
  Settings,
  Clock,
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
  const lateDeadline = ala.lateDeadline ? new Date(ala.lateDeadline) : null;
  const now = new Date();
  const isPastDeadline = deadline < now;
  const isInLateWindow =
    ala.allowLateSubmission &&
    lateDeadline &&
    deadline < now &&
    lateDeadline > now;
  const isPastLateDeadline = lateDeadline && lateDeadline < now;

  const getStatus = () => {
    if (ala.isLocked)
      return {
        label: "Locked",
        className: "border-rose-500/30 bg-rose-500/10 text-rose-600",
        dotColor: "bg-rose-500",
      };
    if (isInLateWindow)
      return {
        label: "Late Window",
        className: "border-orange-500/30 bg-orange-500/10 text-orange-600",
        dotColor: "bg-orange-500",
      };
    if (isPastDeadline || isPastLateDeadline)
      return {
        label: "Past Due",
        className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
        dotColor: "bg-amber-500",
      };
    return {
      label: "Active",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
      dotColor: "bg-emerald-500",
    };
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/professor/alas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold sm:text-2xl">{ala.title}</h2>
              <Badge variant="outline" className={status.className}>
                <span
                  className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${status.dotColor}`}
                />
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              {ala.subjectOfferingId?.subjectId?.code} -{" "}
              {ala.subjectOfferingId?.subjectId?.name} |{" "}
              {ala.subjectOfferingId?.classId?.name}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <Info className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Description</CardTitle>
                    <CardDescription>Assignment details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
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
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <Settings className="h-4 w-4 text-violet-600" />
                  </div>
                  <CardTitle>Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Max Marks</p>
                    <p className="text-muted-foreground text-sm">
                      {ala.maxMarks}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                    <Users className="h-4 w-4 text-violet-600" />
                  </div>
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Allowed Files</p>
                    <p className="text-muted-foreground text-sm uppercase">
                      {ala.allowedFileTypes?.join(", ") || "PDF"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${ala.isLocked ? "bg-rose-500/10" : "bg-emerald-500/10"}`}
                  >
                    {ala.isLocked ? (
                      <Lock className="h-4 w-4 text-rose-600" />
                    ) : (
                      <Unlock className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-muted-foreground text-sm">
                      {ala.isLocked
                        ? "Submissions locked"
                        : "Accepting submissions"}
                    </p>
                  </div>
                </div>

                {/* Late Submission Info */}
                {ala.allowLateSubmission && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Late Submission</p>
                        <p className="text-muted-foreground text-sm">
                          Until{" "}
                          {new Date(ala.lateDeadline).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        {ala.latePenaltyPercent && (
                          <p className="text-xs text-orange-600">
                            -{ala.latePenaltyPercent}% penalty
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
