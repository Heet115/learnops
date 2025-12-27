import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getCurrentUserFromDB } from '@/lib/actions/user.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Clock, CheckCircle } from 'lucide-react';

export default async function ProfessorDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== 'professor') {
    redirect('/unauthorized');
  }

  const dbUser = await getCurrentUserFromDB();

  const user = {
    name: `${dbUser?.firstName || 'Professor'} ${dbUser?.lastName || ''}`.trim(),
    email: dbUser?.email || '',
    avatar: dbUser?.profileImage,
  };

  const stats = [
    { title: 'Active ALAs', value: '0', icon: FileText, description: 'Currently active' },
    { title: 'Students', value: '0', icon: Users, description: 'In your classes' },
    { title: 'Pending', value: '0', icon: Clock, description: 'Awaiting review' },
    { title: 'Graded', value: '0', icon: CheckCircle, description: 'This month' },
  ];

  return (
    <DashboardLayout
      role="professor"
      user={user}
      breadcrumbs={[{ label: 'Professor' }, { label: 'Dashboard' }]}
    >
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold">Welcome, Professor</h2>
          <p className="text-muted-foreground">Manage your classes and ALAs</p>
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Subjects</CardTitle>
              <CardDescription>Assigned teaching subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No subjects assigned yet</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest student submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
