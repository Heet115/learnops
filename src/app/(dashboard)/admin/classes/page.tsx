import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getAllClasses, getAllSemesters } from '@/lib/actions/academic.actions';
import { getCurrentUserFromDB } from '@/lib/actions/user.actions';
import { ClassesTable } from '@/components/admin/classes-table';
import { CreateClassDialog } from '@/components/admin/create-class-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

export default async function ClassesPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== 'admin') {
    redirect('/unauthorized');
  }

  const [classes, semesters, dbUser] = await Promise.all([
    getAllClasses(),
    getAllSemesters(),
    getCurrentUserFromDB(),
  ]);

  const user = {
    name: `${dbUser?.firstName || 'Admin'} ${dbUser?.lastName || ''}`.trim(),
    email: dbUser?.email || '',
    avatar: dbUser?.profileImage,
  };

  return (
    <DashboardLayout
      role="admin"
      user={user}
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Classes' }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Classes</h2>
            <p className="text-muted-foreground">Manage class sections</p>
          </div>
          <CreateClassDialog semesters={semesters} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <ClassesTable classes={classes} semesters={semesters} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
