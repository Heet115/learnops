import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { getAllUsers, getUserStats } from '@/lib/actions/admin.actions';
import { UsersTable } from '@/components/admin/users-table';
import { CreateUserDialog } from '@/components/admin/create-user-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, GraduationCap } from 'lucide-react';

export default async function UsersPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== 'admin') {
    redirect('/unauthorized');
  }

  const [users, stats] = await Promise.all([
    getAllUsers(),
    getUserStats(),
  ]);

  const statCards = [
    { title: 'Total Users', value: stats.total, icon: Users },
    { title: 'Professors', value: stats.professors, icon: UserCheck },
    { title: 'Students', value: stats.students, icon: GraduationCap },
    { title: 'Inactive', value: stats.inactive, icon: UserX },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader title="User Management" />
      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Users</h2>
            <p className="text-muted-foreground">Manage all system users</p>
          </div>
          <CreateUserDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable users={users} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
