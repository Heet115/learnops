import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default async function StudentDashboard() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== 'student') {
    redirect('/unauthorized');
  }

  const stats = [
    { title: 'Pending ALAs', value: '0', icon: FileText, description: 'To submit' },
    { title: 'Due Soon', value: '0', icon: Clock, description: 'Within 3 days' },
    { title: 'Submitted', value: '0', icon: CheckCircle, description: 'This semester' },
    { title: 'Overdue', value: '0', icon: AlertCircle, description: 'Missed deadline' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader title="Student Dashboard" />
      <main className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome, Student</h2>
          <p className="text-muted-foreground">Track your assignments and submissions</p>
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
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>ALAs due soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Grades</CardTitle>
              <CardDescription>Your latest results</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No grades yet</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
