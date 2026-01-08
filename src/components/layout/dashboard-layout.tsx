import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar, UserRole } from "./app-sidebar";
import { ModeToggle } from "../mode-toggle";
import { NotificationBell } from "./notification-bell";
import { ColorThemeSwitcher } from "../color-theme-switcher";

interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  breadcrumbs?: BreadcrumbItemType[];
}

export function DashboardLayout({
  children,
  role,
  user,
  breadcrumbs = [],
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar role={role} user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2">
          <div className="flex items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <BreadcrumbItem
                      key={index}
                      className={index === 0 ? "hidden md:block" : ""}
                    >
                      {index > 0 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                      {item.href ? (
                        <BreadcrumbLink href={item.href}>
                          {item.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-4">
            <NotificationBell role={role} />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <ColorThemeSwitcher />
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
