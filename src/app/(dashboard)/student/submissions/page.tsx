import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { getStudentSubmissions } from "@/lib/actions/submission.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

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

  // Calculate stats
  const submitted = submissions.filter(
    (s: { status: string }) => s.status === "submitted",
  ).length;
  const graded = submissions.filter(
    (s: { status: string }) => s.status === "graded",
  ).length;
  const rejected = submissions.filter(
    (s: { status: string }) => s.status === "rejected",
  ).length;
  const lateSubmissions = submissions.filter(
    (s: { isLate?: boolean }) => s.isLate,
  ).length;

  const statCards = [
    {
      title: "Submitted",
      value: submitted,
      icon: Clock,
      color: "blue",
    },
    {
      title: "Graded",
      value: graded,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      title: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "rose",
    },
    {
      title: "Late",
      value: lateSubmissions,
      icon: AlertTriangle,
      color: "amber",
    },
  ];

  const getStatusBadge = (status: string, isLate?: boolean) => {
    if (status === "graded") {
      return (
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          >
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Graded
          </Badge>
          {isLate && (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600"
            >
              <Clock className="mr-1 h-3 w-3" />
              Late
            </Badge>
          )}
        </div>
      );
    }
    if (status === "submitted") {
      return (
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-blue-600"
          >
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            Submitted
          </Badge>
          {isLate && (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600"
            >
              <Clock className="mr-1 h-3 w-3" />
              Late
            </Badge>
          )}
        </div>
      );
    }
    if (status === "rejected") {
      return (
        <Badge
          variant="outline"
          className="border-rose-500/30 bg-rose-500/10 text-rose-600"
        >
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
        Pending
      </Badge>
    );
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold sm:text-2xl">My Submissions</h2>
              <Badge variant="secondary" className="text-sm">
                {submissions.length} Total
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              View all your ALA submissions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              className="group relative overflow-hidden transition-all hover:shadow-md"
            >
              <div
                className={`absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full ${colorMap[stat.color].split(" ")[0]} opacity-50 transition-transform group-hover:scale-150`}
              />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${colorMap[stat.color]}`}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <ClipboardList className="text-primary h-4 w-4" />
              </div>
              <div>
                <CardTitle>All Submissions</CardTitle>
                <CardDescription>
                  Your submitted work and grades
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                  <FileText className="text-muted-foreground h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-medium">No submissions yet</p>
                <p className="text-muted-foreground text-sm">
                  Go to My ALAs to start submitting.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
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
                        adjustedMarks?: number;
                        isLate?: boolean;
                        latePenaltyApplied?: number;
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
                        <TableRow key={sub._id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                                <FileText className="text-primary h-4 w-4" />
                              </div>
                              <span className="max-w-[200px] truncate font-medium">
                                {sub.alaId?.title || "Unknown ALA"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                            >
                              {sub.alaId?.subjectOfferingId?.subjectId?.code ||
                                "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(sub.status, sub.isLate)}
                          </TableCell>
                          <TableCell>
                            {sub.status === "graded" ? (
                              <div>
                                {sub.isLate &&
                                sub.adjustedMarks !== undefined ? (
                                  <div>
                                    <span className="font-medium">
                                      {sub.adjustedMarks}/{sub.alaId?.maxMarks}
                                    </span>
                                    <p className="text-xs text-amber-600">
                                      ({sub.marks} - {sub.latePenaltyApplied}%)
                                    </p>
                                  </div>
                                ) : (
                                  <span className="font-medium">
                                    {sub.marks}/{sub.alaId?.maxMarks}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {sub.submittedAt
                              ? new Date(sub.submittedAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                            >
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
