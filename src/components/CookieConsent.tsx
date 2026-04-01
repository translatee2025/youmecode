import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STORAGE_KEY = 'nexus_cookie_consent';

interface ConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [prefs, setPrefs] = useState<ConsentState>({
    essential: true, analytics: false, marketing: false, functional: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const save = (consent: ConsentState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);
    setManageOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
        style={{ background: 'hsl(var(--card))', borderTop: '1px solid hsl(var(--border))' }}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <p className="text-sm text-foreground flex-1">
            We use cookies to improve your experience. By continuing, you agree to our cookie policy.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setManageOpen(true)}>Manage</Button>
            <Button size="sm" variant="outline" onClick={() => save({ essential: true, analytics: false, marketing: false, functional: false })}>
              Essential Only
            </Button>
            <Button size="sm" onClick={() => save({ essential: true, analytics: true, marketing: true, functional: true })}>
              Accept All
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cookie Preferences</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-foreground">Essential</p><p className="text-xs text-muted-foreground">Required for the site to work</p></div>
              <Switch checked disabled />
            </div>
            {(['analytics', 'marketing', 'functional'] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground capitalize">{key}</p><p className="text-xs text-muted-foreground">{key === 'analytics' ? 'Help us understand usage' : key === 'marketing' ? 'Personalized content' : 'Enhanced features'}</p></div>
                <Switch checked={prefs[key]} onCheckedChange={(v) => setPrefs({ ...prefs, [key]: v })} />
              </div>
            ))}
            <Button className="w-full" onClick={() => save(prefs)}>Save Preferences</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
