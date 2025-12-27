import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getSubmissionForGrading } from "@/lib/actions/grading.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  XCircle,
  Clock,
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

  const getStatusBadge = () => {
    switch (submission.status) {
      case "graded":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Graded</Badge>;
      case "submitted":
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
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
      <div className="space-y-6 pt-4">
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
          <div className="md:col-span-2 space-y-6">
            {/* Submitted Files */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submission.files && submission.files.length > 0 ? (
                  <div className="space-y-3">
                    {submission.files.map((file: { name: string; url: string; size: number }, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No files submitted</p>
                )}
              </CardContent>
            </Card>

            {/* Submitted Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Submitted Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submission.links && submission.links.length > 0 ? (
                  <div className="space-y-3">
                    {submission.links.map((link: { title: string; url: string }, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{link.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {link.url}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No links submitted</p>
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
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle>Student</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {student?.firstName} {student?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{student?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ALA Info */}
            <Card>
              <CardHeader>
                <CardTitle>ALA Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{ala?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ala?.subjectOfferingId?.subjectId?.code} - {ala?.subjectOfferingId?.subjectId?.name}
                  </p>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ala?.deadline).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium">Max Marks</p>
                  <p className="text-xs text-muted-foreground">{ala?.maxMarks}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium">Submitted At</p>
                  <p className="text-xs text-muted-foreground">
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>

                {submission.gradedAt && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium">Graded At</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.gradedAt).toLocaleString()}
                      </p>
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
