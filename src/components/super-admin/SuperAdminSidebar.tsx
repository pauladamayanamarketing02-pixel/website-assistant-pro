import { useLocation } from "react-router-dom";
import { Shield, type LucideIcon } from "lucide-react";

import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type SuperAdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export function SuperAdminSidebar({ items }: { items: SuperAdminNavItem[] }) {
  const { open } = useSidebar();
  const { pathname } = useLocation();

  return (
    <Sidebar className={open ? "w-72 border-r" : "w-14 border-r"}>
      <SidebarContent>
        {/* Brand */}
        <div className="h-12 flex items-center gap-3 px-3 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {open && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">Super Admin</div>
              <div className="text-xs text-muted-foreground truncate">Control Center</div>
            </div>
          )}
        </div>

        <SidebarGroup>
          {open && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;

                if (item.disabled) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        className={
                          "opacity-60 cursor-not-allowed hover:bg-transparent" +
                          (active ? " bg-sidebar-accent text-sidebar-primary" : "")
                        }
                        aria-disabled
                      >
                        <item.icon className="h-4 w-4" />
                        {open && (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">{item.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-foreground/80">
                              soon
                            </span>
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard/super-admin"}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
