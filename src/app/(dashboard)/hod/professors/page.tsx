import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { connectDB, User, SubjectOffering, ALA, Submission } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  BookOpen,
  FileCheck,
  Clock,
  CheckCircle2,
  TrendingUp,
  Mail,
} from "lucide-react";

async function getHodProfessors() {
  const { userId } = await auth();
  if (!userId) return [];

  await connectDB();
  const hod = await User.findOne({ clerkId: userId, isActive: true });
  if (!hod || !hod.departmentId) return [];

  const professors = await User.find({
    role: "professor",
    departmentId: hod.departmentId,
    isActive: true,
  })
    .select("firstName lastName email profileImage")
    .lean();

  // Get stats for each professor
  const professorStats = await Promise.all(
    professors.map(async (prof) => {
      const offerings = await SubjectOffering.find({
        professorId: prof._id,
        isActive: true,
      });

      const alas = await ALA.find({ professorId: prof._id, isActive: true });
      const alaIds = alas.map((a) => a._id);

      const [pending, graded] = await Promise.all([
        Submission.countDocuments({
          alaId: { $in: alaIds },
          status: "submitted",
        }),
        Submission.countDocuments({ alaId: { $in: alaIds }, status: "graded" }),
      ]);

      return {
        ...prof,
        subjects: offerings.length,
        alas: alas.length,
        pending,
        graded,
      };
    })
  );

  return JSON.parse(JSON.stringify(professorStats));
}

export default async function HodProfessorsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "hod") {
    redirect("/unauthorized");
  }

  const [dbUser, professors] = await Promise.all([
    getCurrentUserFromDB(),
    getHodProfessors(),
  ]);

  const user = {
    name: `${dbUser?.firstName || "HOD"} ${dbUser?.lastName || ""}`.trim(),
    email: dbUser?.email || "",
    avatar: dbUser?.profileImage,
  };

  // Calculate stats
  const totalSubjects = professors.reduce(
    (acc: number, p: { subjects: number }) => acc + p.subjects,
    0
  );
  const totalALAs = professors.reduce(
    (acc: number, p: { alas: number }) => acc + p.alas,
    0
  );
  const totalPending = professors.reduce(
    (acc: number, p: { pending: number }) => acc + p.pending,
    0
  );
  const totalGraded = professors.reduce(
    (acc: number, p: { graded: number }) => acc + p.graded,
    0
  );

  const statCards = [
    {
      title: "Total Professors",
      value: professors.length,
      icon: Users,
      color: "blue",
    },
    {
      title: "Subjects Assigned",
      value: totalSubjects,
      icon: BookOpen,
      color: "violet",
    },
    {
      title: "Pending Reviews",
      value: totalPending,
      icon: Clock,
      color: "amber",
    },
    {
      title: "Graded Submissions",
      value: totalGraded,
      icon: CheckCircle2,
      color: "emerald",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    violet: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  };

  return (
    <DashboardLayout
      role="hod"
      user={user}
      breadcrumbs={[{ label: "HOD" }, { label: "Professors" }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Professors</h2>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {professors.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Faculty members in your department
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
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
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[stat.color]}`}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>All Professors</CardTitle>
                <CardDescription>
                  View professor activity and workload
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {professors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Users className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No professors found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No professors are assigned to your department yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Professor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Subjects</TableHead>
                    <TableHead className="text-center">ALAs</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Graded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professors.map(
                    (prof: {
                      _id: string;
                      firstName: string;
                      lastName: string;
                      email: string;
                      profileImage?: string;
                      subjects: number;
                      alas: number;
                      pending: number;
                      graded: number;
                    }) => (
                      <TableRow key={prof._id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage src={prof.profileImage} />
                              <AvatarFallback className="bg-blue-500/10 text-blue-600 text-sm font-medium">
                                {prof.firstName[0]}
                                {prof.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <p className="font-medium leading-none">
                                {prof.firstName} {prof.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Professor
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="text-sm">{prof.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="border-violet-500/30 bg-violet-500/10 text-violet-600"
                          >
                            {prof.subjects}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                          >
                            {prof.alas}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {prof.pending > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                            >
                              <span className="inline-block mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                              {prof.pending}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              0
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          >
                            <span className="inline-block mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {prof.graded}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
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
