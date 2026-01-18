import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
  Home,
  Building2,
  Sparkles,
  ImageIcon,
  CheckSquare,
  MessageCircle,
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

import DashboardOverview from './user/Overview';
import MyBusiness from './user/MyBusiness';
import ContentPlanner from './user/ContentPlanner';
import AICreation from './user/AICreation';
import MyGallery from './user/MyGallery';
import TasksProgress from './user/TasksProgress';
import Messages from './user/Messages';
import MyPackage from './user/MyPackage';
import Reporting from './user/Reporting';
import LogActivity from './user/LogActivity';
import UserSettings from './user/Settings';

const menuItems: UserNavItem[] = [
  { title: 'Overview', url: '/dashboard/user', icon: Home },
  { title: 'My Business', url: '/dashboard/user/business', icon: Building2 },
  { title: 'Content Planner', url: '/dashboard/user/content-planner', icon: CalendarDays },
  { title: 'Tasks & Progress', url: '/dashboard/user/tasks', icon: CheckSquare },
  { title: 'AI Creation', url: '/dashboard/user/ai-creation', icon: Sparkles },
  { title: 'My Gallery', url: '/dashboard/user/gallery', icon: ImageIcon },
  { title: 'Reporting & Visibility', url: '/dashboard/user/reporting', icon: BarChart3 },
  { title: 'Log Activity', url: '/dashboard/user/log-activity', icon: Activity },
  { title: 'Messages', url: '/dashboard/user/messages', icon: MessageCircle },
  { title: 'My Package', url: '/dashboard/user/package', icon: Package },
  { title: 'Settings', url: '/dashboard/user/settings', icon: Settings },
];

export default function UserDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!loading && (!user || role !== 'user')) {
      navigate('/auth');
      return;
    }

    // Check if user completed onboarding
    const checkOnboarding = async () => {
      if (!user) return;

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

  if (loading || checkingOnboarding) {
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
        <UserSidebar items={menuItems} onLogout={signOut} />

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 h-12 flex items-center gap-3 border-b border-border bg-background px-3">
            <SidebarTrigger />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">Business Dashboard</div>
              <div className="text-xs text-muted-foreground truncate">Workspace</div>
            </div>
          </header>

          <main className="p-6 bg-background overflow-auto">
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="business" element={<MyBusiness />} />
              <Route path="content-planner" element={<ContentPlanner />} />
              <Route path="tasks" element={<TasksProgress />} />
              <Route path="ai-creation" element={<AICreation />} />
              <Route path="gallery" element={<MyGallery />} />
              <Route path="messages" element={<Messages />} />
              <Route path="package" element={<MyPackage />} />
              <Route path="reporting" element={<Reporting />} />
              <Route path="log-activity" element={<LogActivity />} />
              <Route path="settings" element={<UserSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
