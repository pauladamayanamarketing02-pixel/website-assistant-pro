import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BarChart3,
  Bell,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar, type AdminNavItem } from "@/components/admin/AdminSidebar";

import AdminOverview from "./admin/Overview";
import AdminPlaceholder from "./admin/Placeholder";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingAccess, setCheckingAccess] = useState(true);

  const navItems: AdminNavItem[] = useMemo(
    () => [
      { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
      { title: "Users", url: "/dashboard/admin/users", icon: Users, disabled: true },
      { title: "Assists", url: "/dashboard/admin/assists", icon: ShieldCheck, disabled: true },
      { title: "Tasks", url: "/dashboard/admin/tasks", icon: CheckSquare, disabled: true },
      { title: "Reports", url: "/dashboard/admin/reports", icon: BarChart3, disabled: true },
      { title: "Support", url: "/dashboard/admin/support", icon: MessageSquare, disabled: true },
      { title: "Quality Control", url: "/dashboard/admin/qc", icon: ClipboardCheck, disabled: true },
      { title: "Schedule & SLA", url: "/dashboard/admin/schedule", icon: CalendarClock, disabled: true },
      { title: "Announcements", url: "/dashboard/admin/announcements", icon: Bell, disabled: true },
      { title: "Activity Logs", url: "/dashboard/admin/logs", icon: AlertCircle, disabled: true },
      { title: "My Account", url: "/dashboard/admin/account", icon: User, disabled: true },
    ],
    []
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      // Requirement: sebelum login, halaman /dashboard/admin harus tampil 404
      if (!session?.user) {
        navigate("/404", { replace: true });
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const isAdmin = roleData?.role === ("admin" as any);

      if (!isAdmin) {
        await supabase.auth.signOut();
        navigate("/404", { replace: true });
        return;
      }

      setCheckingAccess(false);
    })();
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  if (checkingAccess) return <LoadingScreen />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar items={navItems} />

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 h-12 flex items-center gap-3 border-b border-border bg-background px-3">
            <SidebarTrigger />

            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">Admin Operasional</div>
              <div className="text-xs text-muted-foreground truncate">Control Center</div>
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
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminPlaceholder title="Users" />} />
              <Route path="assists" element={<AdminPlaceholder title="Assists" />} />
              <Route path="tasks" element={<AdminPlaceholder title="Tasks" />} />
              <Route path="reports" element={<AdminPlaceholder title="Reports" />} />
              <Route path="support" element={<AdminPlaceholder title="Support" />} />
              <Route path="qc" element={<AdminPlaceholder title="Quality Control" />} />
              <Route path="schedule" element={<AdminPlaceholder title="Schedule & SLA" />} />
              <Route path="announcements" element={<AdminPlaceholder title="Announcements" />} />
              <Route path="logs" element={<AdminPlaceholder title="Activity Logs" />} />
              <Route path="account" element={<AdminPlaceholder title="My Account" />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
