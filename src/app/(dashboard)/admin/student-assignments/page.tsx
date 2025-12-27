import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getAllClasses } from '@/lib/actions/academic.actions';
import { getCurrentUserFromDB, getAllStudents } from '@/lib/actions/user.actions';
import { StudentAssignmentsTable } from '@/components/admin/student-assignments-table';
import { AssignStudentDialog } from '@/components/admin/assign-student-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, UserCheck, UserX } from 'lucide-react';

export default async function StudentAssignmentsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== 'admin') {
    redirect('/unauthorized');
  }

  const [students, classes, dbUser] = await Promise.all([
    getAllStudents(),
    getAllClasses(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || 'Admin'} ${dbUser?.lastName || ''}`.trim(),
    email: dbUser?.email || '',
    avatar: dbUser?.profileImage,
  };

  const assignedCount = students.filter((s: { classId?: unknown }) => s.classId).length;
  const unassignedCount = students.length - assignedCount;

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Student Assignments' }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Assignments</h2>
            <p className="text-muted-foreground">Assign students to classes/sections</p>
          </div>
          <AssignStudentDialog students={students} classes={classes} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{assignedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <UserX className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unassignedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentAssignmentsTable students={students} classes={classes} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
