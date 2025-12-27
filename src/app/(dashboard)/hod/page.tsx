import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, FileCheck, BarChart3 } from 'lucide-react';

export default async function HodDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== 'hod') {
    redirect('/unauthorized');
  }

  const stats = [
    { title: 'Professors', value: '0', icon: Users, description: 'In department' },
    { title: 'Subjects', value: '0', icon: BookOpen, description: 'This semester' },
    { title: 'Submissions', value: '0', icon: FileCheck, description: 'Pending review' },
    { title: 'Completion Rate', value: '0%', icon: BarChart3, description: 'ALA completion' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader title="HOD Dashboard" />
      <main className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome, Head of Department</h2>
          <p className="text-muted-foreground">Monitor your department&apos;s performance</p>
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
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Classes and subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Submission Analytics</CardTitle>
              <CardDescription>ALA submission heatmap</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
