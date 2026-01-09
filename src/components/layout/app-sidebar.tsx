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
  Calendar,
  Megaphone,
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
        title: "Announcements",
        url: "/admin/announcements",
        icon: Megaphone,
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
        url: "#",
        icon: Building2,
        items: [
          { title: "Overview", url: "/hod/department" },
          { title: "Professors", url: "/hod/professors" },
          { title: "Classes", url: "/hod/classes" },
          { title: "Subjects", url: "/hod/subjects" },
        ],
      },
      {
        title: "Analytics",
        url: "/hod/analytics",
        icon: BarChart3,
      },
      {
        title: "Announcements",
        url: "/hod/announcements",
        icon: Megaphone,
      },
    ],
    professor: [
      {
        title: "Dashboard",
        url: "/professor",
        icon: LayoutDashboard,
      },
      {
        title: "Teaching",
        url: "#",
        icon: BookMarked,
        items: [
          { title: "My Subjects", url: "/professor/subjects" },
          { title: "ALAs", url: "/professor/alas" },
          { title: "Submissions", url: "/professor/submissions" },
          { title: "Students", url: "/professor/students" },
        ],
      },
      {
        title: "Calendar",
        url: "/professor/calendar",
        icon: Calendar,
      },
      {
        title: "Announcements",
        url: "/professor/announcements",
        icon: Megaphone,
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
        title: "Academics",
        url: "#",
        icon: FileText,
        items: [
          { title: "My ALAs", url: "/student/alas" },
          { title: "Submissions", url: "/student/submissions" },
          { title: "Grades", url: "/student/grades" },
        ],
      },
      {
        title: "Schedule",
        url: "#",
        icon: Clock,
        items: [
          { title: "Deadlines", url: "/student/deadlines" },
          { title: "Calendar", url: "/student/calendar" },
          { title: "Timeline", url: "/student/timeline" },
        ],
      },
      {
        title: "Notifications",
        url: "/student/notifications",
        icon: Bell,
      },
      {
        title: "Announcements",
        url: "/student/announcements",
        icon: Megaphone,
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
