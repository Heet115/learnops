import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getCurrentUserFromDB } from "@/lib/actions/user.actions";
import { connectDB, User, SubjectOffering, ALA, Submission, Course, Semester } from "@/lib/db";
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
import { Users } from "lucide-react";

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
  }).select("firstName lastName email profileImage").lean();

  // Get stats for each professor
  const professorStats = await Promise.all(
    professors.map(async (prof) => {
      const offerings = await SubjectOffering.find({ professorId: prof._id, isActive: true });
      const offeringIds = offerings.map(o => o._id);
      
      const alas = await ALA.find({ professorId: prof._id, isActive: true });
      const alaIds = alas.map(a => a._id);

      const [pending, graded] = await Promise.all([
        Submission.countDocuments({ alaId: { $in: alaIds }, status: "submitted" }),
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

  return (
    <DashboardLayout role="hod" user={user} breadcrumbs={[{ label: "HOD" }, { label: "Professors" }]}>
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Professors</h2>
            <p className="text-muted-foreground">Faculty members in your department</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Users className="mr-2 h-4 w-4" />
            {professors.length} Professors
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Professors</CardTitle>
            <CardDescription>View professor activity and workload</CardDescription>
          </CardHeader>
          <CardContent>
            {professors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No professors in department</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Professor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Subjects</TableHead>
                    <TableHead className="text-center">ALAs</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Graded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professors.map((prof: {
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
                    <TableRow key={prof._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={prof.profileImage} />
                            <AvatarFallback>
                              {prof.firstName[0]}{prof.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {prof.firstName} {prof.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{prof.email}</TableCell>
                      <TableCell className="text-center">{prof.subjects}</TableCell>
                      <TableCell className="text-center">{prof.alas}</TableCell>
                      <TableCell className="text-center">
                        {prof.pending > 0 ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            {prof.pending}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-green-600 font-medium">{prof.graded}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
