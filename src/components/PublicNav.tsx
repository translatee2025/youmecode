import { Link } from 'react-router-dom';
import { config } from '@/config';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { to: '/directory', label: 'Directory' },
  { to: '/events', label: 'Events' },
  { to: '/blog', label: 'Blog' },
  { to: '/feed', label: 'Feed' },
];

export default function PublicNav() {
  const { session, profile } = useAuthStore();
  const [open, setOpen] = useState(false);
  const isCreator = profile?.role === 'creator';

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-foreground">
          {config.platformName}
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
          {session ? (
            <div className="flex items-center gap-2">
              {isCreator && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings">Settings</Link>
              </Button>
            </div>
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
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
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
