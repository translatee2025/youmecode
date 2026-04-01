import { useWizardStore } from '@/stores/wizardStore';
import { Check } from 'lucide-react';

const PLATFORM_TYPES = [
  { key: 'directory', emoji: '📍', title: 'Directory', desc: 'Browse and discover places, venues, services' },
  { key: 'marketplace', emoji: '🛒', title: 'Marketplace', desc: 'Buy, sell and trade products or services' },
  { key: 'social', emoji: '📱', title: 'Social App', desc: 'Posts, reels, follows, community feed' },
  { key: 'community', emoji: '💬', title: 'Community', desc: 'Forums, groups, discussions, events' },
  { key: 'trade', emoji: '🏭', title: 'Trade Platform', desc: 'B2B sourcing, export, wholesale' },
  { key: 'events', emoji: '🎫', title: 'Events Platform', desc: 'Discover, list and sell event tickets' },
  { key: 'landing', emoji: '🌐', title: 'Landing Page', desc: 'Simple branded single-page website' },
  { key: 'custom', emoji: '⚙️', title: 'Custom', desc: 'I will configure everything myself' },
];

interface Props {
  onNext: () => void;
}

export function StepPlatformType({ onNext }: Props) {
  const { platformType, setPlatformType } = useWizardStore();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>
          What are you building?
        </h1>
        <p style={{ color: 'var(--color-text-muted, #888)' }}>
          Choose the type that fits best. You can change this anytime.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {PLATFORM_TYPES.map((t) => {
          const selected = platformType === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setPlatformType(t.key)}
              className="relative text-left p-5 md:p-6 rounded-2xl transition-all duration-200 group"
              style={{
                background: selected
                  ? 'rgba(255,255,255,0.1)'
                  : 'var(--color-card-bg, rgba(255,255,255,0.06))',
                border: selected
                  ? '2px solid var(--color-primary, #fff)'
                  : '1px solid var(--color-border, rgba(255,255,255,0.1))',
                boxShadow: selected
                  ? '0 0 30px rgba(255,255,255,0.08)'
                  : 'none',
              }}
            >
              {selected && (
                <div
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-primary, #fff)' }}
                >
                  <Check className="w-4 h-4" style={{ color: 'var(--color-bg, #0a0a0a)' }} />
                </div>
              )}
              <div className="text-3xl mb-3">{t.emoji}</div>
              <h3 className="font-semibold text-base md:text-lg mb-1" style={{ color: 'var(--color-text, #f0f0f0)' }}>
                {t.title}
              </h3>
              <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--color-text-muted, #888)' }}>
                {t.desc}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onNext}
          disabled={!platformType}
          className="px-10 py-3 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
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
