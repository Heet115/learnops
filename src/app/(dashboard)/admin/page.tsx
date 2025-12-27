import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, BookOpen, GraduationCap } from 'lucide-react';
import { getCurrentUserFromDB } from '@/lib/actions/user.actions';

export default async function AdminDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== 'admin') {
    redirect('/unauthorized');
  }

  const dbUser = await getCurrentUserFromDB();

  const stats = [
    { title: 'Total Users', value: '0', icon: Users, description: 'Active users' },
    { title: 'Departments', value: '0', icon: Building2, description: 'Active departments' },
    { title: 'Subjects', value: '0', icon: BookOpen, description: 'Total subjects' },
    { title: 'Students', value: '0', icon: GraduationCap, description: 'Enrolled students' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader title="Admin Dashboard" />
      <main className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome, {dbUser?.firstName || 'Admin'}</h2>
          <p className="text-muted-foreground">Manage your institution from here</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
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

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <p className="text-sm text-muted-foreground">• Create new department</p>
              <p className="text-sm text-muted-foreground">• Add new user</p>
              <p className="text-sm text-muted-foreground">• Manage courses</p>
              <p className="text-sm text-muted-foreground">• View activity logs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
