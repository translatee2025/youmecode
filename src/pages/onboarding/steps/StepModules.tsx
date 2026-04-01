import { useEffect } from 'react';
import { useWizardStore } from '@/stores/wizardStore';
import { ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Globe, MapPin, Newspaper, Film, Search, CalendarDays,
  BookOpen, MessageCircle, MessagesSquare, Users, BarChart3,
  HelpCircle, FileText, User, Bell, Compass
} from 'lucide-react';

const MODULES = [
  { key: 'landing', label: 'Landing Page', desc: 'Branded single-page intro', icon: Globe },
  { key: 'directory', label: 'Directory', desc: 'Browse venues & listings', icon: MapPin },
  { key: 'wall', label: 'Wall (Social Feed)', desc: 'Posts, photos, community', icon: Newspaper },
  { key: 'reels', label: 'Reels', desc: 'Short-form video content', icon: Film },
  { key: 'explore', label: 'Explore & Search', desc: 'Discover trending content', icon: Search },
  { key: 'events', label: 'Events', desc: 'List and attend events', icon: CalendarDays },
  { key: 'blog', label: 'Blog', desc: 'Articles and stories', icon: BookOpen },
  { key: 'messenger', label: 'Messenger (DMs)', desc: 'Private messaging', icon: MessageCircle },
  { key: 'chatrooms', label: 'Chat Rooms', desc: 'Real-time group chat', icon: MessagesSquare },
  { key: 'discussions', label: 'Discussion Boards', desc: 'Forum-style threads', icon: Compass },
  { key: 'groups', label: 'Groups', desc: 'Interest-based communities', icon: Users },
  { key: 'charts', label: 'Charts & Leaderboards', desc: 'Stats and rankings', icon: BarChart3 },
  { key: 'faq', label: 'FAQ', desc: 'Frequently asked questions', icon: HelpCircle },
  { key: 'pages', label: 'CMS Pages', desc: 'Custom static pages', icon: FileText },
  { key: 'profiles', label: 'Profiles', desc: 'User profile pages', icon: User },
  { key: 'notifications', label: 'Notifications', desc: 'In-app alerts', icon: Bell },
];

const DEFAULTS: Record<string, string[]> = {
  directory: ['directory', 'charts', 'faq', 'pages'],
  marketplace: ['directory', 'wall', 'messenger', 'charts', 'pages'],
  social: ['wall', 'reels', 'explore', 'messenger', 'groups', 'profiles'],
  community: ['wall', 'discussions', 'groups', 'events', 'chatrooms', 'faq'],
  trade: ['directory', 'messenger', 'charts', 'pages', 'faq'],
  events: ['events', 'directory', 'wall', 'reels', 'charts'],
  landing: ['landing'],
  custom: MODULES.map((m) => m.key),
};

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function StepModules({ onNext, onBack }: Props) {
  const {
    platformType, enabledModules, setEnabledModules, toggleModule,
    homepageModule, setHomepageModule,
  } = useWizardStore();

  // Set defaults on first render based on platform type
  useEffect(() => {
    if (enabledModules.length === 0 && platformType) {
      const defaults = DEFAULTS[platformType] || [];
      setEnabledModules(defaults);
      setHomepageModule(defaults[0] || '');
    }
  }, [platformType]);

  // Keep homepage valid
  useEffect(() => {
    if (!enabledModules.includes(homepageModule) && enabledModules.length > 0) {
      setHomepageModule(enabledModules[0]);
    }
  }, [enabledModules, homepageModule]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>
          What features do you need?
        </h1>
        <p style={{ color: 'var(--color-text-muted, #888)' }}>
          Toggle the modules for your platform. Change anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MODULES.map((m) => {
          const enabled = enabledModules.includes(m.key);
          const Icon = m.icon;
          return (
            <div
              key={m.key}
              className="flex items-center justify-between p-4 rounded-xl transition-all duration-200"
              style={{
                background: enabled
                  ? 'rgba(255,255,255,0.08)'
                  : 'var(--color-card-bg, rgba(255,255,255,0.04))',
                border: `1px solid ${enabled ? 'rgba(255,255,255,0.15)' : 'var(--color-border, rgba(255,255,255,0.06))'}`,
              }}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" style={{ color: enabled ? 'var(--color-primary, #fff)' : 'var(--color-text-muted, #666)' }} />
                <div>
                  <h4 className="text-sm font-medium" style={{ color: 'var(--color-text, #f0f0f0)' }}>
                    {m.label}
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted, #666)' }}>
                    {m.desc}
                  </p>
                </div>
              </div>
              <Switch checked={enabled} onCheckedChange={() => toggleModule(m.key)} />
            </div>
          );
        })}
      </div>

      {/* Homepage picker */}
      <div className="glass p-5 space-y-3">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text, #f0f0f0)' }}>
          Which module is your homepage?
        </h4>
        <select
          value={homepageModule}
          onChange={(e) => setHomepageModule(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm bg-transparent"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          {enabledModules.map((key) => {
            const mod = MODULES.find((m) => m.key === key);
            return (
              <option key={key} value={key} style={{ background: '#1a1a1a' }}>
                {mod?.label || key}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ color: 'var(--color-text-muted, #888)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={enabledModules.length === 0}
          className="px-10 py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: 'var(--color-button, #fff)',
            color: 'var(--color-bg, #0a0a0a)',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
