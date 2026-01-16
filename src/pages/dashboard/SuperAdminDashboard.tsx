import { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import {
  Activity,
  BadgePercent,
  Banknote,
  BookOpen,
  CreditCard,
  FileSearch,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Package,
  Settings,
  ShieldAlert,
  Users,
  UserCog,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

import Overview from "./super-admin/Overview";
import AdminManagement from "./super-admin/AdminManagement";
import UsersAssists from "./super-admin/UsersAssists";
import ServicesPackages from "./super-admin/ServicesPackages";
import Payments from "./super-admin/Payments";
import Subscriptions from "./super-admin/Subscriptions";
import Promotions from "./super-admin/Promotions";
import Security from "./super-admin/Security";
import AccessControl from "./super-admin/AccessControl";
import AuditLogs from "./super-admin/AuditLogs";
import SystemSettings from "./super-admin/SystemSettings";
import Reports from "./super-admin/Reports";
import CMS from "./super-admin/CMS";
import Emergency from "./super-admin/Emergency";
import MyAccount from "./super-admin/MyAccount";

const menuGroups = [
  {
    label: "Monitoring",
    items: [{ title: "Dashboard", url: "/dashboard/super-admin", icon: LayoutDashboard }],
  },
  {
    label: "Internal",
    items: [{ title: "Admin Management", url: "/dashboard/super-admin/admins", icon: UserCog }],
  },
  {
    label: "Accounts",
    items: [{ title: "Users & Assists", url: "/dashboard/super-admin/accounts", icon: Users }],
  },
  {
    label: "Catalog",
    items: [{ title: "Services / Packages", url: "/dashboard/super-admin/packages", icon: Package }],
  },
  {
    label: "Finance",
    items: [
      { title: "Payments", url: "/dashboard/super-admin/payments", icon: CreditCard },
      { title: "Subscriptions", url: "/dashboard/super-admin/subscriptions", icon: Banknote },
      { title: "Promotions", url: "/dashboard/super-admin/promotions", icon: BadgePercent },
    ],
  },
  {
    label: "Security",
    items: [
      { title: "Security", url: "/dashboard/super-admin/security", icon: Lock },
      { title: "Access Control", url: "/dashboard/super-admin/access-control", icon: KeyRound },
      { title: "Audit Logs", url: "/dashboard/super-admin/audit-logs", icon: FileSearch },
    ],
  },
  {
    label: "System",
    items: [
      { title: "System Settings", url: "/dashboard/super-admin/system", icon: Settings },
      { title: "Reports", url: "/dashboard/super-admin/reports", icon: Activity },
      { title: "CMS", url: "/dashboard/super-admin/cms", icon: BookOpen },
      { title: "Emergency", url: "/dashboard/super-admin/emergency", icon: ShieldAlert },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "My Account", url: "/dashboard/super-admin/me", icon: LifeBuoy },
    ],
  },
] as const;

export default function SuperAdminDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== "super_admin")) {
      navigate("/auth");
    }
  }, [loading, user, role, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <div className="p-4 border-b">
            <div className="rounded-lg bg-sidebar-accent/40 p-3 ring-1 ring-sidebar-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-glow">
                  <span className="text-lg font-bold text-primary-foreground">E</span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                    EasyMarketingAssist
                  </div>
                  <div className="text-xs font-medium text-sidebar-foreground/80">Super Admin</div>
                </div>
              </div>
            </div>
          </div>

          <SidebarContent>
            {menuGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === "/dashboard/super-admin"}
                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                            activeClassName="bg-sidebar-accent text-sidebar-primary"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <div className="mt-auto p-4 border-t">
            <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 p-6 bg-background overflow-auto">
          <SidebarTrigger className="mb-4 md:hidden" />
          <Routes>
            <Route index element={<Overview />} />
            <Route path="admins" element={<AdminManagement />} />
            <Route path="accounts" element={<UsersAssists />} />
            <Route path="packages" element={<ServicesPackages />} />
            <Route path="payments" element={<Payments />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="security" element={<Security />} />
            <Route path="access-control" element={<AccessControl />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="system" element={<SystemSettings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="cms" element={<CMS />} />
            <Route path="emergency" element={<Emergency />} />
            <Route path="me" element={<MyAccount />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}
