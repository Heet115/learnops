import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getStudentSubmissions } from "@/lib/actions/submission.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, CheckCircle, Clock, XCircle, FileEdit } from "lucide-react";

export default async function StudentSubmissionsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "student") {
    redirect("/unauthorized");
  }

  const [dbUser, submissions] = await Promise.all([
    getCurrentUserFromDB(),
    getStudentSubmissions(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Student"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Graded
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            Submitted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <FileEdit className="mr-1 h-3 w-3" />
            Draft
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout
      role="student"
      user={user}
      breadcrumbs={[
        { label: "Student", href: "/student" },
        { label: "Submissions" },
      ]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">My Submissions</h2>
          <p className="text-muted-foreground">View all your ALA submissions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No submissions yet. Go to My ALAs to start submitting.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ALA</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(
                    (sub: {
                      _id: string;
                      status: string;
                      marks?: number;
                      submittedAt?: string;
                      alaId: {
                        _id: string;
                        title: string;
                        maxMarks: number;
                        subjectOfferingId?: {
                          subjectId?: { name: string; code: string };
                        };
                      };
                    }) => (
                      <TableRow key={sub._id}>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {sub.alaId?.title || "Unknown ALA"}
                        </TableCell>
                        <TableCell>
                          {sub.alaId?.subjectOfferingId?.subjectId?.code || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          {sub.status === "graded" ? (
                            <span className="font-medium">
                              {sub.marks}/{sub.alaId?.maxMarks}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {sub.submittedAt
                            ? new Date(sub.submittedAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/student/alas/${sub.alaId?._id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
