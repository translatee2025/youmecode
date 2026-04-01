import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
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
  LayoutDashboard, Layers, Palette, Settings, Languages,
  FolderTree, Filter, Package, FileText, Newspaper, HelpCircle,
  Calendar, Users, Building2, ShoppingBag, Shield, MessageSquare,
  UsersRound, CreditCard, Megaphone, Upload, Globe, BarChart3,
  Lock, Webhook, ClipboardList, Heart, LogOut, Monitor, Paintbrush,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminMode = 'creator' | 'platform';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const creatorNav: NavSection[] = [
  {
    title: 'Platform',
    items: [
      { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
      { title: 'Modules', url: '/admin/modules', icon: Layers },
      { title: 'Theme', url: '/admin/theme', icon: Palette },
      { title: 'Site Settings', url: '/admin/settings', icon: Settings },
      { title: 'AI & Translation', url: '/admin/ai', icon: Languages },
    ],
  },
  {
    title: 'Categories & Filters',
    items: [
      { title: 'Category Manager', url: '/admin/categories', icon: FolderTree },
      { title: 'Filter Management', url: '/admin/filters', icon: Filter },
      { title: 'Product Types', url: '/admin/product-types', icon: Package },
    ],
  },
  {
    title: 'Content',
    items: [
      { title: 'Pages', url: '/admin/pages', icon: FileText },
      { title: 'Blog', url: '/admin/blog', icon: Newspaper },
      { title: 'FAQ', url: '/admin/faq', icon: HelpCircle },
      { title: 'Events', url: '/admin/events', icon: Calendar },
    ],
  },
  {
    title: 'Community',
    items: [
      { title: 'Users', url: '/admin/users', icon: Users },
      { title: 'Venues', url: '/admin/venues', icon: Building2 },
      { title: 'Products', url: '/admin/products', icon: ShoppingBag },
      { title: 'Claims', url: '/admin/claims', icon: Shield },
      { title: 'Moderation', url: '/admin/moderation', icon: MessageSquare },
      { title: 'Discussion Boards', url: '/admin/discussions', icon: UsersRound },
      { title: 'Groups', url: '/admin/groups', icon: UsersRound },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { title: 'Subscription Plans', url: '/admin/subscriptions', icon: CreditCard },
      { title: 'Ad Slots', url: '/admin/ads', icon: Megaphone },
    ],
  },
  {
    title: 'Tools',
    items: [
      { title: 'CSV Import', url: '/admin/import', icon: Upload },
      { title: 'Translations', url: '/admin/translations', icon: Globe },
    ],
  },
];

const platformNav: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Platform Dashboard', url: '/admin', icon: LayoutDashboard },
      { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { title: 'Users', url: '/admin/platform-users', icon: Users },
      { title: 'Permissions', url: '/admin/permissions', icon: Lock },
      { title: 'Webhooks', url: '/admin/webhooks', icon: Webhook },
      { title: 'Audit Log', url: '/admin/audit', icon: ClipboardList },
      { title: 'Health', url: '/admin/health', icon: Heart },
      { title: 'Security', url: '/admin/security', icon: Shield },
      { title: 'Platform Settings', url: '/admin/platform-settings', icon: Settings },
    ],
  },
];

function AdminSidebar({ mode }: { mode: AdminMode }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const nav = mode === 'creator' ? creatorNav : platformNav;

  return (
    <Sidebar collapsible="icon" className="border-r-0" style={{ background: 'var(--color-nav, rgba(10,10,10,0.85))' }}>
      <SidebarContent>
        <ScrollArea className="h-full">
          {nav.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel
                className="text-xs uppercase tracking-wider px-4"
                style={{ color: 'var(--color-text-muted, #888)' }}
              >
                {section.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive =
                      item.url === '/admin'
                        ? currentPath === '/admin'
                        : currentPath.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === '/admin'}
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
          ))}
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}

function ModeSwitcher({ mode, setMode }: { mode: AdminMode; setMode: (m: AdminMode) => void }) {
  return (
    <div className="flex items-center rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setMode('creator')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
          mode === 'creator'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Paintbrush className="h-3.5 w-3.5" />
        Creator
      </button>
      <button
        onClick={() => setMode('platform')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
          mode === 'platform'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Monitor className="h-3.5 w-3.5" />
        Platform
      </button>
    </div>
  );
}

function AdminTopBar({ mode, setMode }: { mode: AdminMode; setMode: (m: AdminMode) => void }) {
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-4 border-b shrink-0"
      style={{
        background: 'var(--color-nav, rgba(10,10,10,0.85))',
        borderColor: 'var(--color-border, rgba(255,255,255,0.1))',
      }}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        {tenant?.logo_url && (
          <img src={tenant.logo_url} alt="" className="h-7" />
        )}
        <span
          className="font-semibold text-sm"
          style={{ color: 'var(--color-text, #f0f0f0)' }}
        >
          {tenant?.name} Admin
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ModeSwitcher mode={mode} setMode={setMode} />
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: 'var(--color-text, #f0f0f0)',
          }}
        >
          {profile?.display_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <button onClick={handleLogout} title="Sign out">
          <LogOut className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>
    </header>
  );
}

export default function AdminLayout() {
  const [mode, setMode] = useState<AdminMode>(() => {
    return (localStorage.getItem('admin_mode') as AdminMode) || 'creator';
  });

  useEffect(() => {
    localStorage.setItem('admin_mode', mode);
  }, [mode]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ background: 'var(--color-bg, #0a0a0a)' }}>
        <AdminSidebar mode={mode} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopBar mode={mode} setMode={setMode} />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
