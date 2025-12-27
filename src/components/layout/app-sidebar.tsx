"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  BookOpen,
  Calendar,
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
  Crown,
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
        isActive: true,
      },
      {
        title: "Users",
        url: "/admin/users",
        icon: Users,
        items: [
          { title: "All Users", url: "/admin/users" },
          { title: "Professors", url: "/admin/users?role=professor" },
          { title: "Students", url: "/admin/users?role=student" },
          { title: "HODs", url: "/admin/users?role=hod" },
        ],
      },
      {
        title: "Departments",
        url: "/admin/departments",
        icon: Building2,
      },
      {
        title: "Courses",
        url: "/admin/courses",
        icon: BookOpen,
      },
      {
        title: "Semesters",
        url: "/admin/semesters",
        icon: Calendar,
      },
      {
        title: "Subjects",
        url: "/admin/subjects",
        icon: BookMarked,
      },
      {
        title: "Classes",
        url: "/admin/classes",
        icon: GraduationCap,
      },
      {
        title: "Subject Offerings",
        url: "/admin/subject-offerings",
        icon: ClipboardList,
      },
      {
        title: "Class Coordinators",
        url: "/admin/class-coordinators",
        icon: Crown,
      },
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
      },
    ],
    hod: [
      {
        title: "Dashboard",
        url: "/hod",
        icon: LayoutDashboard,
        isActive: true,
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
        isActive: true,
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
        items: [
          { title: "All ALAs", url: "/professor/alas" },
          { title: "Create ALA", url: "/professor/alas/create" },
        ],
      },
      {
        title: "Submissions",
        url: "/professor/submissions",
        icon: ClipboardList,
        items: [
          { title: "Pending", url: "/professor/submissions?status=pending" },
          { title: "Graded", url: "/professor/submissions?status=graded" },
        ],
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
        isActive: true,
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
