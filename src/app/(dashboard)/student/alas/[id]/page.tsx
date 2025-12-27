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
} from "lucide-react";
import { SubmissionForm } from "@/components/student/submission-form";
import { GroupSection } from "@/components/student/group-section";

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
  const canSubmit = canModify && submission?.status !== "submitted";

  const getStatusBadge = () => {
    if (submission?.status === "graded") {
      return <Badge className="bg-green-100 text-green-800">Graded</Badge>;
    }
    if (submission?.status === "submitted") {
      return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
    }
    if (submission?.status === "rejected") {
      return <Badge variant="destructive">Rejected - Resubmit</Badge>;
    }
    if (ala.isLocked) {
      return <Badge variant="secondary">Locked</Badge>;
    }
    if (isPastDeadline) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
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
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{ala.description}</p>
              </CardContent>
            </Card>

            {ala.resources && ala.resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resources</CardTitle>
                  <CardDescription>
                    Study materials provided by professor
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                          className="hover:bg-muted flex items-center gap-2 rounded-lg p-2 transition-colors"
                        >
                          <FileText className="text-muted-foreground h-4 w-4" />
                          <span className="text-sm font-medium">
                            {resource.name}
                          </span>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Graded
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-green-600">
                    {submission.marks} / {ala.maxMarks}
                  </div>
                  {submission.feedback && (
                    <div>
                      <p className="mb-1 text-sm font-medium">Feedback:</p>
                      <p className="text-muted-foreground text-sm">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                  {submission.files?.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Your Files:</p>
                      <div className="space-y-2">
                        {submission.files.map(
                          (file: { name: string; url: string }, i: number) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="text-muted-foreground h-4 w-4" />
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
                      <p className="mb-2 text-sm font-medium">Your Links:</p>
                      <div className="space-y-2">
                        {submission.links.map(
                          (link: { title: string; url: string }, i: number) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-colors"
                            >
                              <span className="text-sm">{link.title}</span>
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
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    Submission Rejected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submission.rejectionReason && (
                    <div>
                      <p className="mb-1 text-sm font-medium">Reason:</p>
                      <p className="text-muted-foreground text-sm">
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
              <Card>
                <CardHeader>
                  <CardTitle>Submitted</CardTitle>
                  <CardDescription>
                    Submitted on{" "}
                    {new Date(submission.submittedAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Your submission is being reviewed by the professor.
                  </p>
                  {submission.files?.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Your Files:</p>
                      <div className="space-y-2">
                        {submission.files.map(
                          (file: { name: string; url: string }, i: number) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="text-muted-foreground h-4 w-4" />
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
                      <p className="mb-2 text-sm font-medium">Your Links:</p>
                      <div className="space-y-2">
                        {submission.links.map(
                          (link: { title: string; url: string }, i: number) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-colors"
                            >
                              <span className="text-sm">{link.title}</span>
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
                  <Lock className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
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
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p
                      className={`text-sm ${isPastDeadline ? "text-red-600" : "text-muted-foreground"}`}
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
                  <FileText className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Max Marks</p>
                    <p className="text-muted-foreground text-sm">
                      {ala.maxMarks}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <User className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Professor</p>
                    <p className="text-muted-foreground text-sm">
                      {ala.professorId?.firstName} {ala.professorId?.lastName}
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
                        ? `Group (max ${ala.maxGroupSize || 4} members)`
                        : "Individual"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 text-sm font-medium">Allowed Files</p>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
