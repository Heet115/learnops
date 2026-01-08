import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getALAForSubmission } from "@/lib/actions/submission.actions";
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
  ArrowLeft,
  Calendar,
  FileText,
  User,
  Lock,
  CheckCircle,
  XCircle,
  Users,
  Download,
  ExternalLink,
  BookOpen,
  Info,
  Link as LinkIcon,
  Award,
  File,
} from "lucide-react";
import { SubmissionForm } from "@/components/student/submission-form";
import { GroupSection } from "@/components/student/group-section";

const statusConfig: Record<
  string,
  { label: string; color: string; dotColor: string }
> = {
  graded: {
    label: "Graded",
    color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    dotColor: "bg-emerald-500",
  },
  submitted: {
    label: "Submitted",
    color: "border-blue-500/30 bg-blue-500/10 text-blue-600",
    dotColor: "bg-blue-500",
  },
  rejected: {
    label: "Rejected - Resubmit",
    color: "border-rose-500/30 bg-rose-500/10 text-rose-600",
    dotColor: "bg-rose-500",
  },
  locked: {
    label: "Locked",
    color: "border-slate-500/30 bg-slate-500/10 text-slate-600",
    dotColor: "bg-slate-500",
  },
  overdue: {
    label: "Overdue",
    color: "border-rose-500/30 bg-rose-500/10 text-rose-600",
    dotColor: "bg-rose-500",
  },
  pending: {
    label: "Not Started",
    color: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    dotColor: "bg-amber-500",
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentALAPage({ params }: PageProps) {
  const { id } = await params;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, data] = await Promise.all([
    getCurrentUserFromDB(),
    getALAForSubmission(id),
  ]);

  if (!data) {
    notFound();
  }

  const { ala, submission, studentId } = data;

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const deadline = new Date(ala.deadline);
  const isPastDeadline = deadline < new Date();
  const canModify =
    !ala.isLocked && !isPastDeadline && submission?.status !== "graded";

  const getStatusBadge = () => {
    let status = "pending";
    if (submission?.status === "graded") status = "graded";
    else if (submission?.status === "submitted") status = "submitted";
    else if (submission?.status === "rejected") status = "rejected";
    else if (ala.isLocked) status = "locked";
    else if (isPastDeadline) status = "overdue";

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={config.color}>
        <span
          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${config.dotColor}`}
        />
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[
        { label: "Student", href: "/student" },
        { label: "My ALAs", href: "/student/alas" },
        { label: ala.title },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/student/alas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{ala.title}</h2>
              {getStatusBadge()}
            </div>
            <p className="text-muted-foreground">
              {ala.subjectOfferingId?.subjectId?.code} -{" "}
              {ala.subjectOfferingId?.subjectId?.name}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <Info className="h-4 w-4 text-violet-600" />
                  </div>
                  <CardTitle>Description</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap">{ala.description}</p>
              </CardContent>
            </Card>

            {ala.resources && ala.resources.length > 0 && (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle>Resources</CardTitle>
                      <CardDescription>
                        Study materials provided by professor
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {ala.resources.map(
                      (
                        resource: { name: string; url: string; type: string },
                        index: number,
                      ) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border bg-amber-500/5 p-3 transition-colors hover:bg-amber-500/10"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10">
                            <FileText className="h-4 w-4 text-amber-600" />
                          </div>
                          <span className="flex-1 text-sm font-medium">
                            {resource.name}
                          </span>
                          <Download className="h-4 w-4 text-amber-600" />
                        </a>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Group Section for Group Submissions */}
            {ala.isGroupSubmission && (
              <GroupSection
                alaId={ala._id}
                studentId={studentId}
                groupFormation={ala.groupFormation || "student"}
                maxGroupSize={ala.maxGroupSize || 4}
                canModify={canModify}
              />
            )}

            {/* Submission Form or Result */}
            {submission?.status === "graded" ? (
              <Card className="border-emerald-200">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <CardTitle>Graded</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Award className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Your Score</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {submission.marks} / {ala.maxMarks}
                      </p>
                    </div>
                  </div>
                  {submission.feedback && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="mb-1 text-sm font-medium">Feedback</p>
                      <p className="text-muted-foreground text-sm">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                  {submission.files?.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Your Files</p>
                      <div className="space-y-2">
                        {submission.files.map(
                          (file: { name: string; url: string }, i: number) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between rounded-lg border bg-emerald-500/5 p-3 transition-colors hover:bg-emerald-500/10"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
                                  <File className="h-4 w-4 text-emerald-600" />
                                </div>
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <Download className="h-4 w-4 text-emerald-600" />
                            </a>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {submission.links?.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Your Links</p>
                      <div className="space-y-2">
                        {submission.links.map(
                          (link: { title: string; url: string }, i: number) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between rounded-lg border bg-blue-500/5 p-3 transition-colors hover:bg-blue-500/10"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                                  <LinkIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="text-sm">{link.title}</span>
                              </div>
                              <ExternalLink className="h-4 w-4 text-blue-600" />
                            </a>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : submission?.status === "rejected" ? (
              <Card className="border-rose-200">
                <CardHeader className="border-b border-rose-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                      <XCircle className="h-4 w-4 text-rose-600" />
                    </div>
                    <CardTitle className="text-rose-600">
                      Submission Rejected
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {submission.rejectionReason && (
                    <div className="rounded-lg border border-rose-200 bg-rose-500/5 p-4">
                      <p className="mb-1 text-sm font-medium text-rose-700">
                        Reason
                      </p>
                      <p className="text-sm text-rose-600">
                        {submission.rejectionReason}
                      </p>
                    </div>
                  )}
                  {canModify && (
                    <SubmissionForm
                      alaId={ala._id}
                      studentId={studentId}
                      submission={submission}
                      allowedFileTypes={ala.allowedFileTypes}
                      maxFileSize={ala.maxFileSize}
                    />
                  )}
                </CardContent>
              </Card>
            ) : submission?.status === "submitted" && canModify ? (
              <SubmissionForm
                alaId={ala._id}
                studentId={studentId}
                submission={submission}
                allowedFileTypes={ala.allowedFileTypes}
                maxFileSize={ala.maxFileSize}
                isResubmit={true}
              />
            ) : submission?.status === "submitted" ? (
              <Card className="border-blue-200">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Submitted</CardTitle>
                      <CardDescription>
                        Submitted on{" "}
                        {new Date(submission.submittedAt).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="rounded-lg border bg-blue-500/5 p-4">
                    <p className="text-sm text-blue-600">
                      Your submission is being reviewed by the professor.
                    </p>
                  </div>
                  {submission.files?.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Your Files</p>
                      <div className="space-y-2">
                        {submission.files.map(
                          (file: { name: string; url: string }, i: number) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between rounded-lg border bg-blue-500/5 p-3 transition-colors hover:bg-blue-500/10"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                                  <File className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <Download className="h-4 w-4 text-blue-600" />
                            </a>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {submission.links?.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Your Links</p>
                      <div className="space-y-2">
                        {submission.links.map(
                          (link: { title: string; url: string }, i: number) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between rounded-lg border bg-blue-500/5 p-3 transition-colors hover:bg-blue-500/10"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                                  <LinkIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="text-sm">{link.title}</span>
                              </div>
                              <ExternalLink className="h-4 w-4 text-blue-600" />
                            </a>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : canModify ? (
              <SubmissionForm
                alaId={ala._id}
                studentId={studentId}
                submission={submission}
                allowedFileTypes={ala.allowedFileTypes}
                maxFileSize={ala.maxFileSize}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {ala.isLocked
                      ? "This ALA is locked for submissions"
                      : "The deadline has passed"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle>Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-500/10">
                    <Calendar className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p
                      className={`text-sm ${isPastDeadline ? "text-rose-600" : "text-muted-foreground"}`}
                    >
                      {deadline.toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
                    <Award className="h-4 w-4 text-emerald-600" />
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Professor</p>
                    <p className="text-muted-foreground text-sm">
                      {ala.professorId?.firstName} {ala.professorId?.lastName}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/10">
                    <Users className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Submission Type</p>
                    <p className="text-muted-foreground text-sm">
                      {ala.isGroupSubmission
                        ? `Group (max ${ala.maxGroupSize || 4} members)`
                        : "Individual"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Allowed Files</p>
                    <p className="text-muted-foreground text-sm uppercase">
                      {ala.allowedFileTypes?.join(", ") || "PDF, DOCX, PPT, ZIP"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Max size:{" "}
                      {Math.round(
                        (ala.maxFileSize || 30 * 1024 * 1024) / (1024 * 1024),
                      )}
                      MB
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
