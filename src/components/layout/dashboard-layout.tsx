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
import { ModeToggle } from "../Theme/mode-toggle";
import { NotificationBell } from "./notification-bell";
import { ColorThemeSwitcher } from "../Theme/color-theme-switcher";

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
        <header className="sticky top-0 z-40 flex h-16 rounded-t-xl shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex items-center justify-between rounded-t-xl gap-2 px-4">
            <div className="flex items-center rounded-t-xl gap-2 px-4">
              <SidebarTrigger className="-ml-1 transition-modern hover:bg-accent" />
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
                        <BreadcrumbLink href={item.href} className="transition-modern hover:text-primary">
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-6 md:pt-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
