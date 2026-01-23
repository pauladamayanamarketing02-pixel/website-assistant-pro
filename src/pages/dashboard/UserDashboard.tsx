import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import {
  Home,
  Building2,
  Sparkles,
  ImageIcon,
  CheckSquare,
  MessageCircle,
  LifeBuoy,
  Package,
  BarChart3,
  Activity,
  Settings,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { UserSidebar, type UserNavItem } from '@/components/user/UserSidebar';
import { usePackageMenuRules } from '@/hooks/usePackageMenuRules';

import DashboardOverview from './user/Overview';
import MyBusiness from './user/MyBusiness';
import ContentPlanner from './user/ContentPlanner';
import AICreation from './user/AICreation';
import MyGallery from './user/MyGallery';
import TasksProgress from './user/TasksProgress';
import Messages from './user/Messages';
import UserSupport from './user/Support';
import MyPackage from './user/MyPackage';
import LogActivity from './user/LogActivity';
import UserSettings from './user/Settings';

import ReportingLayout from './user/reporting/ReportingLayout';
import TaskReports from './user/reporting/TaskReports';
import ReportingComingSoon from './user/reporting/ReportingComingSoon';

const menuItems: UserNavItem[] = [
  { title: 'Overview', url: '/dashboard/user/overview', icon: Home },
  { title: 'My Business', url: '/dashboard/user/business', icon: Building2 },
  { title: 'Content Planner', url: '/dashboard/user/content-planner', icon: CalendarDays },
  { title: 'Tasks & Progress', url: '/dashboard/user/tasks', icon: CheckSquare },
  { title: 'AI Agents', url: '/dashboard/user/ai-agents', icon: Sparkles },
  { title: 'My Gallery', url: '/dashboard/user/gallery', icon: ImageIcon },
  { title: 'Reporting & Visibility', url: '/dashboard/user/reporting', icon: BarChart3 },
  { title: 'Messages', url: '/dashboard/user/messages', icon: MessageCircle },
  { title: 'Support', url: '/dashboard/user/support', icon: LifeBuoy },
  { title: 'My Package', url: '/dashboard/user/package', icon: Package },
  { title: 'Log Activity', url: '/dashboard/user/log-activity', icon: Activity },
  { title: 'Settings', url: '/dashboard/user/settings', icon: Settings },
];

export default function UserDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [paymentActive, setPaymentActive] = useState<boolean | null>(null);

  const { loading: loadingMenuRules, isEnabled } = usePackageMenuRules(user?.id);

  const visibleMenuItems = useMemo(() => {
    const hideWhenDisabledByUrl: Record<string, any> = {
      '/dashboard/user/reporting': 'reporting',
    };

    return menuItems
      .filter((item) => {
        const key = hideWhenDisabledByUrl[item.url];
        if (!key) return true;
        return isEnabled(key);
      })
      .map((item) => item);
  }, [isEnabled]);

  const welcomeName = useMemo(() => {
    if (!user) return '';
    const meta: any = (user as any)?.user_metadata ?? {};
    const fromMeta = (meta?.name as string | undefined)?.trim();
    const first = (meta?.first_name as string | undefined)?.trim();
    const last = (meta?.last_name as string | undefined)?.trim();
    const combined = [first, last].filter(Boolean).join(' ').trim();
    return (fromMeta || combined || user.email?.split('@')[0] || '');
  }, [user]);

  useEffect(() => {
    if (!loading && (!user || role !== 'user')) {
      navigate('/auth');
      return;
    }

    // Check if user completed onboarding
    const checkOnboarding = async () => {
      if (!user) return;

      // If opened via Super Admin magic-link, allow bypass onboarding check (verified server-side).
      const imp = new URLSearchParams(window.location.search).get('imp');
      if (imp) {
        try {
          const { data, error } = await supabase.functions.invoke('super-admin-impersonation-verify', {
            body: { token: imp },
          });
          if (!error && (data as any)?.allow === true) {
            setCheckingOnboarding(false);
            return;
          }
        } catch {
          // ignore and fall back to normal onboarding check
        }
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!business || !business.onboarding_completed) {
        navigate('/onboarding/welcome');
      }
      setCheckingOnboarding(false);
    };

    if (user && role === 'user') {
      checkOnboarding();
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const fetchPayment = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("payment_active")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      // default true (matches DB default) if anything goes wrong
      if (error) {
        setPaymentActive(true);
        return;
      }
      setPaymentActive(Boolean((data as any)?.payment_active ?? true));
    };

    fetchPayment();

    const channel = supabase
      .channel(`user-payment-active-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => fetchPayment()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const gatedMenuItems = useMemo(() => {
    // Keep hooks order stable (must run on every render)
    if (paymentActive === false) {
      const allowed = new Set<string>([
        "/dashboard/user/package",
        "/dashboard/user/support",
        "/dashboard/user/log-activity",
        "/dashboard/user/settings",
        "/dashboard/user/overview",
      ]);

      return menuItems.map((i) => ({ ...i, disabled: !allowed.has(i.url) }));
    }

    // paymentActive === true OR still loading payment -> show normal menu set
    return loadingMenuRules ? menuItems : visibleMenuItems;
  }, [loadingMenuRules, paymentActive, visibleMenuItems]);

  const userIsNonActive = paymentActive === false;

  if (loading || checkingOnboarding || paymentActive === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;


  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <UserSidebar items={gatedMenuItems} onLogout={signOut} />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-20 h-12 flex items-center gap-3 border-b border-border bg-background px-3">
            <SidebarTrigger />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">Welcome {welcomeName}</div>
              <div className="text-xs text-muted-foreground truncate">Workspace</div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-background overflow-auto">
            <Routes>
              <Route
                index
                element={userIsNonActive ? <Navigate to="/dashboard/user/package" replace /> : <DashboardOverview />}
              />
              <Route
                path="overview"
                element={<DashboardOverview />}
              />
              <Route
                path="business"
                element={userIsNonActive ? <Navigate to="/dashboard/user/package" replace /> : <MyBusiness />}
              />
              <Route
                path="content-planner"
                element={userIsNonActive ? <Navigate to="/dashboard/user/package" replace /> : <ContentPlanner />}
              />
              <Route
                path="tasks"
                element={userIsNonActive ? <Navigate to="/dashboard/user/package" replace /> : <TasksProgress />}
              />
              {/* Backward-compatible route */}
              <Route path="ai-creation" element={<Navigate to="/dashboard/user/ai-agents" replace />} />
              <Route
                path="ai-agents"
                element={userIsNonActive ? <Navigate to="/dashboard/user/package" replace /> : <AICreation />}
              />
              <Route
                path="gallery"
                element={userIsNonActive ? <Navigate to="/dashboard/user/package" replace /> : <MyGallery />}
              />
              <Route
                path="messages"
                element={userIsNonActive ? <Navigate to="/dashboard/user/package" replace /> : <Messages />}
              />
              <Route
                path="support"
                element={<UserSupport />}
              />
              <Route path="package" element={<MyPackage />} />
              <Route
                path="reporting"
                element={userIsNonActive ? <Navigate to="/dashboard/user/package" replace /> : <ReportingLayout />}
              >
                <Route index element={<Navigate to="task-reports" replace />} />
                <Route path="task-reports" element={<TaskReports />} />
                <Route path="performance-summary" element={<ReportingComingSoon title="Performance Summary" />} />
                <Route path="local-insights" element={<ReportingComingSoon title="Local Insights" />} />
                <Route path="keyword-rankings" element={<ReportingComingSoon title="Keyword Rankings" />} />
                <Route path="traffic-insights" element={<ReportingComingSoon title="Traffic Insights" />} />
                <Route path="conversion-insights" element={<ReportingComingSoon title="Conversion Insights" />} />
                <Route path="downloadable-reports" element={<ReportingComingSoon title="Downloadable Reports" />} />
              </Route>
              <Route
                path="log-activity"
                element={<LogActivity />}
              />
              <Route
                path="settings"
                element={<UserSettings />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
