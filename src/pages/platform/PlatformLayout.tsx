import { Outlet, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { supabase } from '@/integrations/supabase/client';
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
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard, Building2, Users, Settings, BarChart3,
  Shield, LogOut,
} from 'lucide-react';

const platformNav = [
  { title: 'Dashboard', url: '/platform', icon: LayoutDashboard },
  { title: 'Tenants', url: '/platform/tenants', icon: Building2 },
  { title: 'Users', url: '/platform/users', icon: Users },
  { title: 'Analytics', url: '/platform/analytics', icon: BarChart3 },
  { title: 'Security', url: '/platform/security', icon: Shield },
  { title: 'Settings', url: '/platform/settings', icon: Settings },
];

function PlatformSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="icon" className="border-r-0" style={{ background: 'var(--color-nav, rgba(10,10,10,0.85))' }}>
      <SidebarContent>
        <ScrollArea className="h-full">
          <SidebarGroup>
            <SidebarGroupLabel
              className="text-xs uppercase tracking-wider px-4"
              style={{ color: 'var(--color-text-muted, #888)' }}
            >
              Platform Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {platformNav.map((item) => {
                  const isActive =
                    item.url === '/platform'
                      ? currentPath === '/platform'
                      : currentPath.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === '/platform'}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors"
                          activeClassName="font-medium"
                          style={
                            isActive
                              ? {
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'var(--color-primary, #fff)',
                                }
                              : { color: 'var(--color-text-muted, #888)' }
                          }
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}

export default function PlatformLayout() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ background: 'var(--color-bg, #0a0a0a)' }}>
        <PlatformSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="h-14 flex items-center justify-between px-4 border-b shrink-0"
            style={{
              background: 'var(--color-nav, rgba(10,10,10,0.85))',
              borderColor: 'var(--color-border, rgba(255,255,255,0.1))',
            }}
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span
                className="font-semibold text-sm"
                style={{ color: 'var(--color-text, #f0f0f0)' }}
              >
                Platform Administration
              </span>
            </div>
            <button onClick={handleLogout} title="Sign out">
              <LogOut className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
