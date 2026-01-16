import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { 
  Home, Building2, Sparkles, ImageIcon, 
  CheckSquare, MessageCircle, Package, CreditCard, 
  BarChart3, Settings, LogOut, CalendarDays 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { supabase } from '@/integrations/supabase/client';

import DashboardOverview from './user/Overview';
import MyBusiness from './user/MyBusiness';
import ContentPlanner from './user/ContentPlanner';
import AICreation from './user/AICreation';
import MyGallery from './user/MyGallery';
import TasksProgress from './user/TasksProgress';
import Messages from './user/Messages';
import MyPackage from './user/MyPackage';
import Billing from './user/Billing';
import Reporting from './user/Reporting';
import UserSettings from './user/Settings';

const menuItems = [
  { title: 'Overview', url: '/dashboard/user', icon: Home },
  { title: 'My Business', url: '/dashboard/user/business', icon: Building2 },
  { title: 'Content Planner', url: '/dashboard/user/content-planner', icon: CalendarDays },
  { title: 'Tasks & Progress', url: '/dashboard/user/tasks', icon: CheckSquare },
  { title: 'AI Creation', url: '/dashboard/user/ai-creation', icon: Sparkles },
  { title: 'My Gallery', url: '/dashboard/user/gallery', icon: ImageIcon },
  { title: 'Reporting & Visibility', url: '/dashboard/user/reporting', icon: BarChart3 },
  { title: 'Messages', url: '/dashboard/user/messages', icon: MessageCircle },
  { title: 'My Package', url: '/dashboard/user/package', icon: Package },
  { title: 'Billing', url: '/dashboard/user/billing', icon: CreditCard },
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
        <Sidebar className="border-r">
          <div className="p-4 border-b">
            <span className="font-bold text-lg text-foreground">EasyMarketing</span>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === '/dashboard/user'}
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
            <Route path="business" element={<MyBusiness />} />
            <Route path="content-planner" element={<ContentPlanner />} />
            <Route path="tasks" element={<TasksProgress />} />
            <Route path="ai-creation" element={<AICreation />} />
            <Route path="gallery" element={<MyGallery />} />
            <Route path="messages" element={<Messages />} />
            <Route path="package" element={<MyPackage />} />
            <Route path="billing" element={<Billing />} />
            <Route path="reporting" element={<Reporting />} />
            <Route path="settings" element={<UserSettings />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}
