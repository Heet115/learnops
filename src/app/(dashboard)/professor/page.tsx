import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getProfessorDashboardStats,
  getProfessorRecentSubmissions,
  getProfessorSubjects,
} from "@/lib/actions/dashboard.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn, SlideUp } from "@/components/ui/page-transition";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export default async function ProfessorDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "professor") {
    redirect("/unauthorized");
  }

  const [dbUser, stats, recentSubmissions, subjects] = await Promise.all([
    getCurrentUserFromDB(),
    getProfessorDashboardStats(),
    getProfessorRecentSubmissions(),
    getProfessorSubjects(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "Professor"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const statCards = [
    {
      title: "Active ALAs",
      value: stats.activeALAs,
      icon: FileText,
      description: "Currently active",
      color: "text-blue-600",
    },
    {
      title: "Students",
      value: stats.studentCount,
      icon: Users,
      description: "In your classes",
      color: "text-purple-600",
    },
    {
      title: "Pending Review",
      value: stats.pendingSubmissions,
      icon: Clock,
      description: "Awaiting grading",
      color: "text-orange-600",
    },
    {
      title: "Graded",
      value: stats.gradedThisMonth,
      icon: CheckCircle,
      description: "Total graded",
      color: "text-green-600",
    },
  ];

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[{ label: "Professor" }, { label: "Dashboard" }]}
    >
      <div className="space-y-6 pt-4">
        <FadeIn>
          <div>
            <h2 className="text-2xl font-bold">
              Welcome back, Prof. {dbUser?.lastName || dbUser?.firstName || ""}
            </h2>
            <p className="text-muted-foreground">Manage your classes and ALAs</p>
          </div>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <SlideUp key={stat.title} delay={index * 75}>
              <Card className="card-hover group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color} transition-transform duration-200 group-hover:scale-110`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>
                    {stat.value}
                  </div>
                  <CardDescription>{stat.description}</CardDescription>
                </CardContent>
              </Card>
            </SlideUp>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FadeIn delay={300}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Subjects</CardTitle>
                  <CardDescription>Assigned teaching subjects</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/professor/alas">
                    Manage ALAs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <IllustratedEmpty
                    preset="noSubjects"
                    title="No subjects assigned"
                    description="Contact admin to get subjects assigned to you."
                    size="sm"
                  />
                ) : (
                  <div className="space-y-3">
                    {subjects.map(
                      (offering: {
                        _id: string;
                        subjectId: { name: string; code: string };
                        classId: { name: string };
                      }) => (
                        <div
                          key={offering._id}
                          className="flex items-center justify-between rounded-lg border p-3 transition-all hover:bg-muted/50 hover:border-muted-foreground/20"
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen className="text-muted-foreground h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">
                                {offering.subjectId.code} -{" "}
                                {offering.subjectId.name}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {offering.classId.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={375}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Latest student submissions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/professor/submissions">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentSubmissions.length === 0 ? (
                  <IllustratedEmpty
                    preset="noSubmissions"
                    title="No submissions yet"
                    description="Student submissions will appear here."
                    size="sm"
                  />
                ) : (
                  <div className="space-y-3">
                    {recentSubmissions.map(
                      (sub: {
                        _id: string;
                        submittedAt: string;
                        studentId: { firstName: string; lastName: string };
                        alaId: { _id: string; title: string };
                      }) => (
                        <Link
                          key={sub._id}
                          href={`/professor/submissions/${sub._id}`}
                          className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-all hover:border-muted-foreground/20"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={`${sub.studentId.firstName} ${sub.studentId.lastName}`}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {sub.studentId.firstName} {sub.studentId.lastName}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {sub.alaId.title}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {formatTime(sub.submittedAt)}
                          </Badge>
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </DashboardLayout>
  );
}
