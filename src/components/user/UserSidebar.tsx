import { useMemo } from "react";
import { LogOut, type LucideIcon } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

export type UserNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export function UserSidebar({
  items,
  onLogout,
}: {
  items: UserNavItem[];
  onLogout: () => void;
}) {
  const { open } = useSidebar();
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessagesCount(user?.id);

  const showMessagesBadge = useMemo(() => unreadCount > 0, [unreadCount]);
  return (
    <Sidebar
      className={
        (open ? "w-[--sidebar-width]" : "w-[--sidebar-width-icon]") +
        " border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      }
      collapsible="icon"
    >
      <SidebarContent>
        {/* Brand */}
        <div className="h-12 flex items-center gap-3 px-3 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary">
            <span className="text-sm font-bold text-sidebar-primary-foreground">E</span>
          </div>
          {open && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-sidebar-foreground truncate">
                EasyMarketingAssist
              </div>
              <div className="text-xs text-sidebar-foreground/70 truncate">
                Business Dashboard
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          {open && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isMessages = item.url === "/dashboard/user/messages";

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard/user"}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent/70"
                        activeClassName="bg-sidebar-accent text-sidebar-primary"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span className="truncate flex-1">{item.title}</span>}

                        {/* Unread messages badge */}
                        {isMessages && showMessagesBadge && (
                          open ? (
                            <span className="ml-auto min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs tabular-nums">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          ) : (
                            <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />
                          )
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className={open ? "w-full justify-start" : "w-full justify-center"}
            onClick={onLogout}
          >
            <LogOut className={open ? "h-4 w-4 mr-2" : "h-4 w-4"} />
            {open && <span>Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
