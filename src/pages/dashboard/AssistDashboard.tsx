import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { 
  Home, Users, CheckSquare, Sparkles, MessageCircle, BarChart3, 
  Globe, Settings, LogOut, User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, 
  SidebarGroupContent, SidebarMenu, SidebarMenuButton, 
  SidebarMenuItem, SidebarTrigger 
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { supabase } from '@/integrations/supabase/client';

// Import components
import ClientList from './assist/ClientList';
import TaskManager from './assist/TaskManager';
import AIGenerator from './assist/AIGenerator';
import AssistMessages from './assist/Messages';
import Reports from './assist/Reports';
import EasyMarketingAssist from './assist/EasyMarketingAssist';
import ConfigPage from './assist/config/ConfigPage';
import AssistSettings from './assist/Settings';
import AssistProfile from './assist/Profile';

const mainMenuItems = [
  { title: 'Overview', url: '/dashboard/assist', icon: Home },
  { title: 'Profile', url: '/dashboard/assist/profile', icon: User },
  { title: 'Client List', url: '/dashboard/assist/clients', icon: Users },
  { title: 'Task Manager', url: '/dashboard/assist/tasks', icon: CheckSquare },
  { title: 'AI Generator', url: '/dashboard/assist/ai-generator', icon: Sparkles },
  { title: 'Messages', url: '/dashboard/assist/messages', icon: MessageCircle },
  { title: 'Reports', url: '/dashboard/assist/reports', icon: BarChart3 },
  { title: 'EasyMarketingAssist', url: '/dashboard/assist/ema', icon: Globe },
  { title: 'Config', url: '/dashboard/assist/config', icon: Settings },
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

  useEffect(() => {
    if (!loading && (!user || role !== 'assist')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (!loading && user && role === 'assist') {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .maybeSingle();

          if (error) throw error;

          const completed = data?.onboarding_completed ?? false;

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
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <div className="p-4 border-b">
            <div className="rounded-lg bg-sidebar-accent/40 p-3 ring-1 ring-sidebar-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-glow">
                  <span className="text-lg font-bold text-primary-foreground">E</span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">EasyMarketingAssist</div>
                  <div className="text-xs font-medium text-sidebar-foreground/80">Assist Portal</div>
                </div>
              </div>
            </div>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end={item.url === '/dashboard/assist'} 
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent" 
                          activeClassName="bg-sidebar-accent text-sidebar-primary"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {/* Settings */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to="/dashboard/assist/settings" 
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent" 
                        activeClassName="bg-sidebar-accent text-sidebar-primary"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
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
            <Route index element={<DashboardOverview />} />
            <Route path="profile" element={<AssistProfile />} />
            <Route path="clients" element={<ClientList />} />
            <Route path="tasks" element={<TaskManager />} />
            <Route path="ai-generator" element={<AIGenerator />} />
            <Route path="messages" element={<AssistMessages />} />
            <Route path="reports" element={<Reports />} />
            <Route path="ema" element={<EasyMarketingAssist />} />
            <Route path="config" element={<ConfigPage />} />
            <Route path="settings" element={<AssistSettings />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}
