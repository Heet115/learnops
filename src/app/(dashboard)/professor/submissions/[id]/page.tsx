import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getSubmissionForGrading } from "@/lib/actions/grading.actions";
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
  Link as LinkIcon,
  ExternalLink,
  Download,
  CheckCircle,
  Users,
  BookOpen,
  Info,
} from "lucide-react";
import { GradingForm } from "@/components/professor/grading-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const [dbUser, submission] = await Promise.all([
    getCurrentUserFromDB(),
    getSubmissionForGrading(id),
  ]);

  if (!submission) {
    notFound();
  }

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const ala = submission.alaId;
  const student = submission.studentId;
  const groupMembers = submission.groupMembers || [];
  const isGroupSubmission = ala?.isGroupSubmission && groupMembers.length > 0;
  const allMembers = isGroupSubmission ? [student, ...groupMembers] : [student];

  const getStatusBadge = () => {
    switch (submission.status) {
      case "graded":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          >
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Graded
          </Badge>
        );
      case "submitted":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-600"
          >
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 bg-rose-500/10 text-rose-600"
          >
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{submission.status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[
        { label: "Professor", href: "/professor" },
        { label: "Submissions", href: "/professor/submissions" },
        { label: `${student?.firstName} ${student?.lastName}` },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/professor/submissions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">
                {student?.firstName} {student?.lastName}
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-muted-foreground">{ala?.title}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {/* Submitted Files */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Submitted Files</CardTitle>
                    <CardDescription>
                      {submission.files?.length || 0} file(s) uploaded
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {submission.files && submission.files.length > 0 ? (
                  <div className="space-y-2">
                    {submission.files.map(
                      (
                        file: { name: string; url: string; size: number },
                        index: number,
                      ) => (
                        <div
                          key={index}
                          className="group bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                      <FileText className="text-muted-foreground h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-medium">No files</p>
                    <p className="text-muted-foreground text-sm">
                      No files were submitted
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submitted Links */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <LinkIcon className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle>Submitted Links</CardTitle>
                    <CardDescription>
                      {submission.links?.length || 0} link(s) provided
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {submission.links && submission.links.length > 0 ? (
                  <div className="space-y-2">
                    {submission.links.map(
                      (link: { title: string; url: string }, index: number) => (
                        <div
                          key={index}
                          className="group bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                              <LinkIcon className="h-4 w-4 text-violet-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {link.title}
                              </p>
                              <p className="text-muted-foreground max-w-[300px] truncate text-xs">
                                {link.url}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open
                            </a>
                          </Button>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                      <LinkIcon className="text-muted-foreground h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-medium">No links</p>
                    <p className="text-muted-foreground text-sm">
                      No links were submitted
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grading Form */}
            <GradingForm
              submissionId={submission._id}
              currentStatus={submission.status}
              currentMarks={submission.marks}
              currentFeedback={submission.feedback}
              currentRejectionReason={submission.rejectionReason}
              maxMarks={ala?.maxMarks || 100}
            />
          </div>

          <div className="space-y-6">
            {/* Student/Group Info */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    {isGroupSubmission ? (
                      <Users className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <User className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <CardTitle>
                    {isGroupSubmission ? "Group Submission" : "Student"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {isGroupSubmission ? (
                  <>
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs">
                        Group Members ({allMembers.length})
                      </p>
                      <div className="space-y-2">
                        {allMembers.map(
                          (
                            member: {
                              firstName: string;
                              lastName: string;
                              email?: string;
                            },
                            index: number,
                          ) => (
                            <div
                              key={index}
                              className="bg-muted/30 flex items-center gap-2 rounded-lg border p-2"
                            >
                              <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-full">
                                <User className="text-primary h-3 w-3" />
                              </div>
                              <span className="text-sm">
                                {member.firstName} {member.lastName}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Submitted by
                      </p>
                      <p className="text-sm font-medium">
                        {student?.firstName} {student?.lastName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {student?.email}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <User className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {student?.firstName} {student?.lastName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {student?.email}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ALA Info */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                    <Info className="h-4 w-4 text-amber-600" />
                  </div>
                  <CardTitle>ALA Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ala?.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {ala?.subjectOfferingId?.subjectId?.code} -{" "}
                      {ala?.subjectOfferingId?.subjectId?.name}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(ala?.deadline).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg border p-3 text-center">
                    <p className="text-muted-foreground text-xs">Max Marks</p>
                    <p className="text-lg font-bold">{ala?.maxMarks}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg border p-3 text-center">
                    <p className="text-muted-foreground text-xs">Submitted</p>
                    <p className="text-sm font-medium">
                      {submission.submittedAt
                        ? new Date(submission.submittedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )
                        : "-"}
                    </p>
                  </div>
                </div>

                {submission.gradedAt && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Graded At</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(submission.gradedAt).toLocaleString()}
                        </p>
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
