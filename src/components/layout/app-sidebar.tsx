"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  GraduationCap,
  FileText,
  BarChart3,
  Settings,
  LifeBuoy,
  Send,
  LayoutDashboard,
  BookMarked,
  ClipboardList,
  Clock,
  Bell,
  User,
  Activity,
} from "lucide-react";

import { NavMain } from "@/components/layout/nav-main";
import { NavSecondary } from "@/components/layout/nav-secondary";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export type UserRole = "admin" | "hod" | "professor" | "student";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role: UserRole;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const getNavItems = (role: UserRole) => {
  const navItems = {
    admin: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Users",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Academic Structure",
        url: "#",
        icon: Building2,
        items: [
          { title: "Departments", url: "/admin/departments" },
          { title: "Courses", url: "/admin/courses" },
          { title: "Semesters", url: "/admin/semesters" },
          { title: "Subjects", url: "/admin/subjects" },
          { title: "Classes", url: "/admin/classes" },
        ],
      },
      {
        title: "Assignments",
        url: "#",
        icon: ClipboardList,
        items: [
          { title: "Subject Offerings", url: "/admin/subject-offerings" },
          { title: "Class Coordinators", url: "/admin/class-coordinators" },
          { title: "Student Assignments", url: "/admin/student-assignments" },
        ],
      },
      {
        title: "Administration",
        url: "#",
        icon: Settings,
        items: [
          { title: "Profile Requests", url: "/admin/profile-requests" },
          { title: "Audit Trail", url: "/admin/audit-trail" },
          { title: "Settings", url: "/admin/settings" },
        ],
      },
    ],
    hod: [
      {
        title: "Dashboard",
        url: "/hod",
        icon: LayoutDashboard,
      },
      {
        title: "Department",
        url: "/hod/department",
        icon: Building2,
      },
      {
        title: "Professors",
        url: "/hod/professors",
        icon: Users,
      },
      {
        title: "Classes",
        url: "/hod/classes",
        icon: GraduationCap,
      },
      {
        title: "Subjects",
        url: "/hod/subjects",
        icon: BookMarked,
      },
      {
        title: "Analytics",
        url: "/hod/analytics",
        icon: BarChart3,
      },
    ],
    professor: [
      {
        title: "Dashboard",
        url: "/professor",
        icon: LayoutDashboard,
      },
      {
        title: "My Subjects",
        url: "/professor/subjects",
        icon: BookMarked,
      },
      {
        title: "ALAs",
        url: "/professor/alas",
        icon: FileText,
      },
      {
        title: "Submissions",
        url: "/professor/submissions",
        icon: ClipboardList,
      },
      {
        title: "Students",
        url: "/professor/students",
        icon: GraduationCap,
      },
    ],
    student: [
      {
        title: "Dashboard",
        url: "/student",
        icon: LayoutDashboard,
      },
      {
        title: "My Profile",
        url: "/student/profile",
        icon: User,
      },
      {
        title: "My ALAs",
        url: "/student/alas",
        icon: FileText,
      },
      {
        title: "Submissions",
        url: "/student/submissions",
        icon: ClipboardList,
      },
      {
        title: "Deadlines",
        url: "/student/deadlines",
        icon: Clock,
      },
      {
        title: "Grades",
        url: "/student/grades",
        icon: BarChart3,
      },
      {
        title: "Notifications",
        url: "/student/notifications",
        icon: Bell,
      },
      {
        title: "Timeline",
        url: "/student/timeline",
        icon: Activity,
      },
    ],
  };

  return navItems[role] || [];
};

const navSecondary = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
];

export function AppSidebar({ role, user, ...props }: AppSidebarProps) {
  const navMain = getNavItems(role);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/${role}`}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">LearnOps</span>
                  <span className="truncate text-xs capitalize">
                    {role} Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
