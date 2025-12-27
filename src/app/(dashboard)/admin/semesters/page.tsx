import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getAllSemesters, getAllCourses } from '@/lib/actions/academic.actions';
import { getCurrentUserFromDB } from '@/lib/actions/user.actions';
import { SemestersTable } from '@/components/admin/semesters-table';
import { CreateSemesterDialog } from '@/components/admin/create-semester-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default async function SemestersPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== 'admin') {
    redirect('/unauthorized');
  }

  const [semesters, courses, dbUser] = await Promise.all([
    getAllSemesters(),
    getAllCourses(),
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
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Semesters' }]}
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Semesters</h2>
            <p className="text-muted-foreground">Manage academic semesters</p>
          </div>
          <CreateSemesterDialog courses={courses} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Semesters</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{semesters.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Semesters</CardTitle>
          </CardHeader>
          <CardContent>
            <SemestersTable semesters={semesters} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
