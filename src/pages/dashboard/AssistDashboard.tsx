import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import {
  Home,
  Users,
  CheckSquare,
  Sparkles,
  MessageCircle,
  BarChart3,
  Activity,
  Settings,
  User,
  PenLine,
  Images,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { AssistSidebar, type AssistNavItem } from '@/components/assist/AssistSidebar';

// Import components
import ClientList from './assist/ClientList';
import TaskManager from './assist/TaskManager';
import ContentCreation from './assist/ContentCreation';
import AssistMediaLibrary from './assist/MediaLibrary';
import AssistCalendar from './assist/Calendar';
import AssistScheduledContentView from './assist/calendar/ViewScheduledContent';
import AIGenerator from './assist/AIGenerator';
import AssistMessages from './assist/Messages';
import Reports from './assist/Reports';
import LogActivity from './assist/LogActivity';
import AssistSettings from './assist/Settings';
import AssistProfile from './assist/Profile';

const mainMenuItems: AssistNavItem[] = [
  { title: 'Overview', url: '/dashboard/assist', icon: Home },
  { title: 'Profile', url: '/dashboard/assist/profile', icon: User },
  { title: 'Client List', url: '/dashboard/assist/clients', icon: Users },
  { title: 'Task Manager', url: '/dashboard/assist/tasks', icon: CheckSquare },
  { title: 'Content Creation', url: '/dashboard/assist/content-creation', icon: PenLine },
  { title: 'Media Library', url: '/dashboard/assist/media-library', icon: Images },
  { title: 'Calendar', url: '/dashboard/assist/calendar', icon: CalendarDays },
  { title: 'AI Agents', url: '/dashboard/assist/ai-agents', icon: Sparkles },
  { title: 'Messages', url: '/dashboard/assist/messages', icon: MessageCircle },
  { title: 'Reports', url: '/dashboard/assist/reports', icon: BarChart3 },
  { title: 'Log Activity', url: '/dashboard/assist/log-activity', icon: Activity },
  { title: 'Settings', url: '/dashboard/assist/settings', icon: Settings },
];

function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assist Dashboard</h1>
        <p className="text-muted-foreground">Manage your clients and tasks.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">8</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">15</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posts This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">24</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">5</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AssistDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

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
    if (!loading && (!user || role !== 'assist')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (!loading && user && role === 'assist') {
      (async () => {
        try {
          const { data, error } = await (supabase as any)
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .maybeSingle();

          if (error) throw error;

          const completed = (data as any)?.onboarding_completed ?? false;

          if (!completed) {
            navigate('/orientation/welcome');
          } else {
            setOnboardingChecked(true);
          }
        } catch (err) {
          console.error('Error checking onboarding status:', err);
          setOnboardingChecked(true);
        }
      })();
    }
  }, [loading, user, role, navigate]);

  if (loading || (role === 'assist' && !onboardingChecked)) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;


  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <AssistSidebar items={mainMenuItems} onLogout={signOut} />

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
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<AssistProfile />} />
              <Route path="clients" element={<ClientList />} />
              <Route path="tasks" element={<TaskManager />} />
              <Route path="content-creation" element={<ContentCreation />} />
              <Route path="media-library" element={<AssistMediaLibrary />} />
              <Route path="calendar" element={<AssistCalendar />} />
              <Route path="calendar/view/:id" element={<AssistScheduledContentView />} />
              {/* Backward-compatible route */}
              <Route path="ai-generator" element={<Navigate to="/dashboard/assist/ai-agents" replace />} />
              <Route path="ai-agents" element={<AIGenerator />} />
              <Route path="messages" element={<AssistMessages />} />
              <Route path="reports" element={<Reports />} />
              <Route path="log-activity" element={<LogActivity />} />
              <Route path="settings" element={<AssistSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
