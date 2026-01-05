import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import {
  getHodDashboardStats,
  getHodDepartmentOverview,
} from "@/lib/actions/dashboard.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn, SlideUp } from "@/components/ui/page-transition";
import { IllustratedEmpty } from "@/components/ui/illustrated-empty";
import {
  Users,
  BookOpen,
  FileCheck,
  BarChart3,
  GraduationCap,
} from "lucide-react";

export default async function HodDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "hod") {
    redirect("/unauthorized");
  }

  const [dbUser, stats, overview] = await Promise.all([
    getCurrentUserFromDB(),
    getHodDashboardStats(),
    getHodDepartmentOverview(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "HOD"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  const statCards = [
    {
      title: "Professors",
      value: stats.professors,
      icon: Users,
      description: "In department",
      color: "text-blue-600",
    },
    {
      title: "Subjects",
      value: stats.subjects,
      icon: BookOpen,
      description: "Total subjects",
      color: "text-purple-600",
    },
    {
      title: "Pending Review",
      value: stats.pendingSubmissions,
      icon: FileCheck,
      description: "Awaiting grading",
      color: "text-orange-600",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate}%`,
      icon: BarChart3,
      description: "ALA completion",
      color: stats.completionRate >= 70 ? "text-green-600" : "text-yellow-600",
    },
  ];

  return (
    <DashboardLayout
      role="hod"
      user={user}
      breadcrumbs={[{ label: "HOD" }, { label: "Dashboard" }]}
    >
      <div className="space-y-6 pt-4">
        <FadeIn>
          <div>
            <h2 className="text-2xl font-bold">
              Welcome back, {dbUser?.firstName || "Head of Department"}
            </h2>
            <p className="text-muted-foreground">
              Monitor your department&apos;s performance
            </p>
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
                  <stat.icon
                    className={`h-4 w-4 ${stat.color} transition-transform duration-200 group-hover:scale-110`}
                  />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold tabular-nums ${stat.color}`}
                  >
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
              <CardHeader>
                <CardTitle>Courses</CardTitle>
                <CardDescription>Courses in your department</CardDescription>
              </CardHeader>
              <CardContent>
                {overview.courses.length === 0 ? (
                  <IllustratedEmpty
                    preset="noSubjects"
                    title="No courses found"
                    description="Courses will appear here once created."
                    size="sm"
                  />
                ) : (
                  <div className="space-y-3">
                    {overview.courses.map(
                      (course: { _id: string; name: string; code: string }) => (
                        <div
                          key={course._id}
                          className="hover:bg-muted/50 hover:border-muted-foreground/20 flex items-center justify-between rounded-lg border p-3 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <GraduationCap className="text-muted-foreground h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">
                                {course.name}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {course.code}
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
              <CardHeader>
                <CardTitle>Classes</CardTitle>
                <CardDescription>Active classes in department</CardDescription>
              </CardHeader>
              <CardContent>
                {overview.classes.length === 0 ? (
                  <IllustratedEmpty
                    preset="noClasses"
                    title="No classes found"
                    description="Classes will appear here once created."
                    size="sm"
                  />
                ) : (
                  <div className="space-y-3">
                    {overview.classes.slice(0, 5).map(
                      (cls: {
                        _id: string;
                        name: string;
                        academicYear: string;
                        semesterId?: {
                          name: string;
                          courseId?: { code: string };
                        };
                      }) => (
                        <div
                          key={cls._id}
                          className="hover:bg-muted/50 hover:border-muted-foreground/20 flex items-center justify-between rounded-lg border p-3 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="text-muted-foreground h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">{cls.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {cls.semesterId?.courseId?.code} -{" "}
                                {cls.semesterId?.name}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{cls.academicYear}</Badge>
                        </div>
                      ),
                    )}
                    {overview.classes.length > 5 && (
                      <p className="text-muted-foreground text-center text-xs">
                        +{overview.classes.length - 5} more classes
                      </p>
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
