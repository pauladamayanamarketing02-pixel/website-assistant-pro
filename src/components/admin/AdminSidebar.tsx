import { useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

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

export type AdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export function AdminSidebar({ items }: { items: AdminNavItem[] }) {
  const { open } = useSidebar();
  const { pathname } = useLocation();

  return (
    <Sidebar className={open ? "w-72 border-r" : "w-14 border-r"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Operasional</SidebarGroupLabel>
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
                          <div className="flex items-center gap-2">
                            <span>{item.title}</span>
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
                        end={item.url === "/dashboard/admin"}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
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
