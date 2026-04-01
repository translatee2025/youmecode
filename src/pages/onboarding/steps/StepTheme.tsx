import { useState } from 'react';
import { useWizardStore, ThemeColors } from '@/stores/wizardStore';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const PRESETS: { name: string; colors: ThemeColors }[] = [
  {
    name: 'Dark Minimal',
    colors: {
      bg: '#0a0a0a', cardBg: 'rgba(255,255,255,0.06)', text: '#f0f0f0',
      textMuted: '#888888', primary: '#ffffff', nav: 'rgba(10,10,10,0.85)',
      button: '#ffffff', border: 'rgba(255,255,255,0.1)',
    },
  },
  {
    name: 'Pure White',
    colors: {
      bg: '#ffffff', cardBg: 'rgba(0,0,0,0.03)', text: '#111111',
      textMuted: '#666666', primary: '#111111', nav: 'rgba(255,255,255,0.95)',
      button: '#111111', border: 'rgba(0,0,0,0.1)',
    },
  },
  {
    name: 'Midnight Blue',
    colors: {
      bg: '#0d1b2a', cardBg: 'rgba(79,195,247,0.06)', text: '#e8f4f8',
      textMuted: '#7fb8cc', primary: '#4fc3f7', nav: 'rgba(13,27,42,0.9)',
      button: '#4fc3f7', border: 'rgba(79,195,247,0.15)',
    },
  },
  {
    name: 'Deep Forest',
    colors: {
      bg: '#0d1f0d', cardBg: 'rgba(129,199,132,0.06)', text: '#e8f5e9',
      textMuted: '#81c784', primary: '#81c784', nav: 'rgba(13,31,13,0.9)',
      button: '#81c784', border: 'rgba(129,199,132,0.15)',
    },
  },
  {
    name: 'Warm Sand',
    colors: {
      bg: '#faf3e0', cardBg: 'rgba(62,39,35,0.05)', text: '#3e2723',
      textMuted: '#8d6e63', primary: '#bf360c', nav: 'rgba(250,243,224,0.95)',
      button: '#bf360c', border: 'rgba(62,39,35,0.12)',
    },
  },
  {
    name: 'Neon Night',
    colors: {
      bg: '#0a0a0a', cardBg: 'rgba(255,0,170,0.06)', text: '#f0f0f0',
      textMuted: '#cc66aa', primary: '#ff00aa', nav: 'rgba(10,10,10,0.9)',
      button: '#ff00aa', border: 'rgba(255,0,170,0.15)',
    },
  },
];

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'bg', label: 'Background' },
  { key: 'cardBg', label: 'Card Surface' },
  { key: 'primary', label: 'Primary Accent' },
  { key: 'text', label: 'Text' },
  { key: 'nav', label: 'Nav Bar' },
  { key: 'button', label: 'Button' },
  { key: 'border', label: 'Border' },
];

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function StepTheme({ onNext, onBack }: Props) {
  const { colors, setColors, setColorKey, platformName, logoUrl } = useWizardStore();
  const [customOpen, setCustomOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('Dark Minimal');

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setColors(preset.colors);
    setActivePreset(preset.name);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>
          Make it yours
        </h1>
        <p style={{ color: 'var(--color-text-muted, #888)' }}>
          Pick a colour palette or customise your own.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left — Palettes */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => selectPreset(preset)}
                className="text-left p-4 rounded-xl transition-all duration-200"
                style={{
                  background: preset.colors.bg,
                  border: activePreset === preset.name
                    ? `2px solid ${preset.colors.primary}`
                    : '1px solid rgba(128,128,128,0.2)',
                  boxShadow: activePreset === preset.name
                    ? `0 0 20px ${preset.colors.primary}22`
                    : 'none',
                }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: preset.colors.text }}>
                  {preset.name}
                </p>
                <div className="flex gap-1">
                  {[preset.colors.bg, preset.colors.primary, preset.colors.text, preset.colors.button].map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full"
                      style={{
                        background: c,
                        border: '1px solid rgba(128,128,128,0.3)',
                      }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Custom expander */}
          <button
            onClick={() => setCustomOpen(!customOpen)}
            className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium"
            style={{
              background: 'var(--color-card-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            Customise
            {customOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {customOpen && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              {COLOR_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {f.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors[f.key].startsWith('rgba') ? '#888888' : colors[f.key]}
                      onChange={(e) => {
                        setColorKey(f.key, e.target.value);
                        setActivePreset(null);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-none"
                      style={{ background: 'transparent' }}
                    />
                    <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {colors[f.key].substring(0, 20)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Live Preview */}
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Live Preview
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(128,128,128,0.2)' }}>
            {/* Nav */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: colors.nav }}>
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-7 w-7 rounded-lg object-cover" />
              ) : (
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: colors.primary, color: colors.bg }}
                >
                  {platformName?.[0]?.toUpperCase() || 'N'}
                </div>
              )}
              <span className="text-sm font-semibold" style={{ color: colors.text }}>
                {platformName || 'Your Platform'}
              </span>
            </div>
            {/* Content */}
            <div className="p-4 space-y-3" style={{ background: colors.bg }}>
              <div
                className="p-4 rounded-xl"
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: colors.text }}>
                  Glass Card
                </p>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Your content lives here.
                </p>
              </div>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: colors.button, color: colors.bg }}
              >
                Primary Button
              </button>
              <div className="flex gap-2">
                <div className="h-8 flex-1 rounded-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }} />
                <div className="h-8 flex-1 rounded-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ color: 'var(--color-text-muted, #888)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onNext}
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className="px-10 py-3 rounded-xl font-semibold text-base"
            style={{
              background: 'var(--color-button, #fff)',
              color: 'var(--color-bg, #0a0a0a)',
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
