import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BadgePercent,
  Bell,
  BookOpen,
  CreditCard,
  FileSearch,
  LayoutDashboard,
  Lock,
  LogOut,
  Package,
  Settings,
  Shield,
  Siren,
  Users,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar, type SuperAdminNavItem } from "@/components/super-admin/SuperAdminSidebar";

import SuperAdminOverview from "./super-admin/Overview";
import SuperAdminPlaceholder from "./super-admin/Placeholder";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingAccess, setCheckingAccess] = useState(true);

  const navItems: SuperAdminNavItem[] = useMemo(
    () => [
      { title: "Dashboard", url: "/dashboard/super-admin", icon: LayoutDashboard },
      { title: "Admin Management", url: "/dashboard/super-admin/admin-management", icon: Shield, disabled: true },
      { title: "Users & Assists", url: "/dashboard/super-admin/users-assists", icon: Users, disabled: true },
      { title: "Services / Packages", url: "/dashboard/super-admin/packages", icon: Package, disabled: true },
      { title: "Payments", url: "/dashboard/super-admin/payments", icon: CreditCard, disabled: true },
      { title: "Subscriptions", url: "/dashboard/super-admin/subscriptions", icon: Activity, disabled: true },
      { title: "Promotions", url: "/dashboard/super-admin/promotions", icon: BadgePercent, disabled: true },
      { title: "Security", url: "/dashboard/super-admin/security", icon: Lock, disabled: true },
      { title: "Access Control", url: "/dashboard/super-admin/access-control", icon: Bell, disabled: true },
      { title: "Audit Logs", url: "/dashboard/super-admin/audit-logs", icon: FileSearch, disabled: true },
      { title: "System Settings", url: "/dashboard/super-admin/system-settings", icon: Settings, disabled: true },
      { title: "Reports", url: "/dashboard/super-admin/reports", icon: BookOpen, disabled: true },
      { title: "CMS", url: "/dashboard/super-admin/cms", icon: BookOpen, disabled: true },
      { title: "Emergency", url: "/dashboard/super-admin/emergency", icon: Siren, disabled: true },
      { title: "My Account", url: "/dashboard/super-admin/my-account", icon: Shield, disabled: true },
    ],
    []
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.user) {
        navigate("/super-admin/login", { replace: true, state: { from: location.pathname } });
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Type assertion: role enum tidak selalu sinkron dengan types.ts
      const isSuperAdmin = roleData?.role === ("super_admin" as any);

      if (!isSuperAdmin) {
        await supabase.auth.signOut();
        navigate("/super-admin/login", { replace: true });
        return;
      }

      setCheckingAccess(false);
    })();
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/super-admin/login", { replace: true });
  };

  if (checkingAccess) return <LoadingScreen />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SuperAdminSidebar items={navItems} />

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 h-12 flex items-center gap-3 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Trigger SELALU terlihat */}
            <SidebarTrigger />

            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shrink-0">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">Super Admin</div>
                <div className="text-xs text-muted-foreground truncate">Control Center</div>
              </div>
            </div>

            <div className="ml-auto">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>

          <main className="p-6 bg-background overflow-auto">
            <Routes>
              <Route index element={<SuperAdminOverview />} />
              <Route
                path="admin-management"
                element={<SuperAdminPlaceholder title="Admin Management" />}
              />
              <Route
                path="users-assists"
                element={<SuperAdminPlaceholder title="Users & Assists" />}
              />
              <Route path="packages" element={<SuperAdminPlaceholder title="Services / Packages" />} />
              <Route path="payments" element={<SuperAdminPlaceholder title="Payments" />} />
              <Route path="subscriptions" element={<SuperAdminPlaceholder title="Subscriptions" />} />
              <Route path="promotions" element={<SuperAdminPlaceholder title="Promotions" />} />
              <Route path="security" element={<SuperAdminPlaceholder title="Security" />} />
              <Route path="access-control" element={<SuperAdminPlaceholder title="Access Control" />} />
              <Route path="audit-logs" element={<SuperAdminPlaceholder title="Audit Logs" />} />
              <Route path="system-settings" element={<SuperAdminPlaceholder title="System Settings" />} />
              <Route path="reports" element={<SuperAdminPlaceholder title="Reports" />} />
              <Route path="cms" element={<SuperAdminPlaceholder title="CMS" />} />
              <Route path="emergency" element={<SuperAdminPlaceholder title="Emergency Tools" />} />
              <Route path="my-account" element={<SuperAdminPlaceholder title="My Account" />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
