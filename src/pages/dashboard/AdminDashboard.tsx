import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BarChart3,
  Bell,
  Briefcase,
  CheckSquare,
  FileQuestion,
  FileText,
  Globe,
  Home as HomeIcon,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  MessageSquare,
  Newspaper,
  Phone,
  Package,
  PanelsTopLeft,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar, type AdminNavItem } from "@/components/admin/AdminSidebar";

import AdminOverview from "./admin/Overview";
import AdminPlaceholder from "./admin/Placeholder";
import AdminWebsiteBlog from "./admin/WebsiteBlog";
import AdminWebsiteBlogCreate from "./admin/WebsiteBlogCreate";
import AdminWebsiteBlogEdit from "./admin/WebsiteBlogEdit";
import AdminWebsiteMedia from "./admin/WebsiteMedia";
import AdminWebsiteContact from "./admin/WebsiteContact";
import AdminWebsiteServices from "./admin/WebsiteServices";
import AdminWebsiteFaqs from "./admin/WebsiteFaqs";
import AdminWebsitePackages from "./admin/WebsitePackages";
import AdminWebsiteLayout from "./admin/WebsiteLayout";
import AdminWebsiteHomepage from "./admin/WebsiteHomepage";
import AdminWebsiteDomainTools from "./admin/WebsiteDomainTools";
import AdminBusinessUsers from "./admin/BusinessUsers";
import AdminBusinessUserDetails from "./admin/BusinessUserDetails";
import AdminCreateBusinessUser from "./admin/BusinessUserCreate";
import AdminAssistants from "./admin/Assistants";
import AdminAssistantDetails from "./admin/AssistantDetails";
import AdminAssistantCreate from "./admin/AssistantCreate";
import AdminTasks from "./admin/Tasks";
import AdminTaskCreate from "./admin/TaskCreate";
import AdminSupport from "./admin/Support";
import AdminAccount from "./admin/Account";
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
  const [supportNewCount, setSupportNewCount] = useState(0);

  const fetchSupportNewCount = async () => {
    try {
      const { count, error } = await (supabase as any)
        .from("website_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new")
        // Keep badge aligned with Support page scope (exclude internal sources)
        .not("source", "in", '("business_support","assistant_support")');

      if (error) throw error;
      setSupportNewCount(Number(count ?? 0));
    } catch {
      // If anything fails, don't block the dashboard.
      setSupportNewCount(0);
    }
  };

  const navItems: AdminNavItem[] = useMemo(
    () => [
      { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
      { title: "Business", url: "/dashboard/admin/business-users", icon: Users },
      { title: "Assistant", url: "/dashboard/admin/assistants", icon: ShieldCheck },
      { title: "Tasks", url: "/dashboard/admin/tasks", icon: CheckSquare },
      { title: "Reports", url: "/dashboard/admin/reports", icon: BarChart3 },
      { title: "Messages (soon)", url: "/dashboard/admin/messages", icon: MessageSquare },
      {
        title: "Website",
        url: "/dashboard/admin/website",
        icon: Globe,
        children: [
          { title: "Homepage", url: "/dashboard/admin/website/homepage", icon: HomeIcon },
          { title: "Pages", url: "/dashboard/admin/website/pages", icon: FileText },
          { title: "Blog", url: "/dashboard/admin/website/blog", icon: Newspaper },
          { title: "Media Library", url: "/dashboard/admin/website/media", icon: Image },
          { title: "Contact", url: "/dashboard/admin/website/contact", icon: Phone },
          { title: "Services", url: "/dashboard/admin/website/services", icon: Briefcase },
          { title: "FAQs", url: "/dashboard/admin/website/services/faqs", icon: FileQuestion },
          { title: "Packages", url: "/dashboard/admin/website/packages", icon: Package },
          { title: "Layout", url: "/dashboard/admin/website/layout", icon: LayoutTemplate },
          {
            title: "Support",
            url: "/dashboard/admin/website/support",
            icon: MessageSquare,
            badgeCount: supportNewCount > 0 ? supportNewCount : undefined,
          },

           // Templates (Order)
           { title: "Templates", url: "/dashboard/admin/website/templates", icon: SlidersHorizontal },
        ],
      },
      {
        title: "Analytics",
        url: "/dashboard/admin/analytics",
        icon: TrendingUp,
        children: [
          { title: "Traffic", url: "/dashboard/admin/analytics/traffic", icon: TrendingUp },
          { title: "Pages", url: "/dashboard/admin/analytics/pages", icon: FileText },
          { title: "Blog Performance", url: "/dashboard/admin/analytics/blog-performance", icon: Newspaper },
          { title: "Campaign (UTM)", url: "/dashboard/admin/analytics/campaign", icon: MessageSquare },
          { title: "Conversion (read-only)", url: "/dashboard/admin/analytics/conversion", icon: BarChart3 },
        ],
      },
      { title: "Dashboard Banners (soon)", url: "/dashboard/admin/dashboard-banners", icon: PanelsTopLeft },
      { title: "Announcements (soon)", url: "/dashboard/admin/announcements", icon: Bell },
      { title: "Activity Logs (soon)", url: "/dashboard/admin/logs", icon: AlertCircle },
      { title: "My Account", url: "/dashboard/admin/account", icon: User },
    ],
    [supportNewCount]
  );

  useEffect(() => {
    void fetchSupportNewCount();

    const channel = supabase
      .channel("admin-support-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "website_inquiries" },
        () => void fetchSupportNewCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <div className="text-sm font-semibold text-foreground truncate">Operations Admin</div>
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
              <Route path="business-users" element={<AdminBusinessUsers />} />
              <Route path="business-users/new" element={<AdminCreateBusinessUser />} />
              <Route path="business-users/:userId" element={<AdminBusinessUserDetails />} />
              <Route path="assistants" element={<AdminAssistants />} />
              <Route path="assistants/new" element={<AdminAssistantCreate />} />
              <Route path="assistants/:userId" element={<AdminAssistantDetails />} />
              <Route path="tasks" element={<AdminTasks />} />
              <Route path="tasks/new" element={<AdminTaskCreate />} />
              <Route path="reports" element={<AdminPlaceholder title="Reports" />} />
              <Route path="messages" element={<AdminPlaceholder title="Messages" />} />
              <Route path="website/pages" element={<AdminPlaceholder title="Pages" />} />
              <Route path="website/homepage" element={<AdminWebsiteHomepage />} />
              <Route path="website/blog" element={<AdminWebsiteBlog />} />
              <Route path="website/blog/new" element={<AdminWebsiteBlogCreate />} />
              <Route path="website/blog/:id" element={<AdminWebsiteBlogEdit />} />
              <Route path="website/media" element={<AdminWebsiteMedia />} />
              <Route path="website/contact" element={<AdminWebsiteContact />} />
              <Route path="website/services" element={<AdminWebsiteServices />} />
              <Route path="website/services/faqs" element={<AdminWebsiteFaqs />} />
              <Route path="website/packages" element={<AdminWebsitePackages />} />
              <Route path="website/layout" element={<AdminWebsiteLayout />} />
              <Route path="website/support" element={<AdminSupport />} />

              {/* Templates (Order) */}
              <Route path="website/templates" element={<AdminWebsiteDomainTools />} />

              {/* Analytics */}
              <Route path="analytics/traffic" element={<AdminPlaceholder title="Traffic" />} />
              <Route path="analytics/pages" element={<AdminPlaceholder title="Analytics Pages" />} />
              <Route path="analytics/blog-performance" element={<AdminPlaceholder title="Blog Performance" />} />
              <Route path="analytics/campaign" element={<AdminPlaceholder title="Campaign (UTM)" />} />
              <Route path="analytics/conversion" element={<AdminPlaceholder title="Conversion (read-only)" />} />

              <Route path="dashboard-banners" element={<AdminPlaceholder title="Dashboard Banners" />} />

              <Route path="announcements" element={<AdminPlaceholder title="Announcements" />} />
              <Route path="logs" element={<AdminPlaceholder title="Activity Logs" />} />
              <Route path="account" element={<AdminAccount />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
