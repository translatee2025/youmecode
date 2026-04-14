import { Link, useLocation } from 'react-router-dom';
import { config } from '@/config';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/directory', label: 'Directory' },
  { to: '/events', label: 'Events' },
  { to: '/blog', label: 'Blog' },
  { to: '/feed', label: 'Feed' },
  { to: '/discussions', label: 'Discussions' },
  { to: '/groups', label: 'Groups' },
  { to: '/explore', label: 'Explore' },
];

export default function PublicNav() {
  const { session, profile } = useAuthStore();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isCreator = profile?.role === 'creator';

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-foreground">
          {config.platformName}
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                location.pathname.startsWith(l.to)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              {isCreator && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings">Settings</Link>
              </Button>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={cn(
                'block py-2 text-sm',
                location.pathname.startsWith(l.to)
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <>
              {isCreator && (
                <Link to="/admin" onClick={() => setOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">Admin</Link>
              )}
              <Link to="/settings" onClick={() => setOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">Settings</Link>
            </>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-primary">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
