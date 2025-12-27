import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, BookOpen, GraduationCap } from 'lucide-react';
import { getCurrentUserFromDB } from '@/lib/actions/user.actions';
import { getUserStats } from '@/lib/actions/admin.actions';
import { getAcademicStats } from '@/lib/actions/academic.actions';

export default async function AdminDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== 'admin') {
    redirect('/unauthorized');
  }

  const [dbUser, userStats, academicStats] = await Promise.all([
    getCurrentUserFromDB(),
    getUserStats(),
    getAcademicStats(),
  ]);

  const user = {
    name: `${dbUser?.firstName || 'Admin'} ${dbUser?.lastName || ''}`.trim(),
    email: dbUser?.email || '',
    avatar: dbUser?.profileImage,
  };

  const statCards = [
    { title: 'Total Users', value: userStats.total, icon: Users, description: 'Active users' },
    { title: 'Departments', value: academicStats.departments, icon: Building2, description: 'Active departments' },
    { title: 'Courses', value: academicStats.courses, icon: BookOpen, description: 'Total courses' },
    { title: 'Students', value: userStats.students, icon: GraduationCap, description: 'Enrolled students' },
  ];

  return (
    <DashboardLayout role="admin" user={user} breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {dbUser?.firstName || 'Admin'}</h2>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening in your institution</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">All systems operational</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
