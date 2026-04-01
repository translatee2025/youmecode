import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWizardStore } from '@/stores/wizardStore';
import { Check, ArrowLeft } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface CategoryPackage {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  suggested_categories: Json;
}

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const ICONS: Record<string, string> = {
  'party-popper': '🎉', utensils: '🍽️', sparkles: '✨', car: '🚗',
  building: '🏢', handshake: '🤝', briefcase: '💼', dumbbell: '💪',
  'calendar-days': '📅', 'paw-print': '🐾', heart: '❤️',
  'graduation-cap': '🎓', plane: '✈️', wrench: '🔧', users: '👥',
};

export function StepCategoryPackages({ onNext, onBack }: Props) {
  const { selectedPackageIds, togglePackage } = useWizardStore();
  const [packages, setPackages] = useState<CategoryPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('category_packages')
      .select('id, name, slug, icon, description, suggested_categories')
      .order('name')
      .then(({ data }) => {
        setPackages((data as CategoryPackage[]) || []);
        setLoading(false);
      });
  }, []);

  const getCategoryNames = (cats: Json): string[] => {
    if (!Array.isArray(cats)) return [];
    return (cats as { name?: string }[])
      .filter((c) => c.name)
      .slice(0, 3)
      .map((c) => c.name!);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>
          What is your platform about?
        </h1>
        <p style={{ color: 'var(--color-text-muted, #888)' }}>
          Pick the category packages that fit your niche.
          <br />
          Each one adds ready-made categories and smart filters instantly.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-primary, #fff)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {packages.map((pkg) => {
            const selected = selectedPackageIds.includes(pkg.id);
            const cats = getCategoryNames(pkg.suggested_categories);
            return (
              <button
                key={pkg.id}
                onClick={() => togglePackage(pkg.id)}
                className="relative text-left p-4 md:p-5 rounded-2xl transition-all duration-200"
                style={{
                  background: selected
                    ? 'rgba(255,255,255,0.1)'
                    : 'var(--color-card-bg, rgba(255,255,255,0.06))',
                  border: selected
                    ? '2px solid var(--color-primary, #fff)'
                    : '1px solid var(--color-border, rgba(255,255,255,0.1))',
                  boxShadow: selected ? '0 0 20px rgba(255,255,255,0.06)' : 'none',
                }}
              >
                {selected && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-primary, #fff)' }}
                  >
                    <Check className="w-3 h-3" style={{ color: 'var(--color-bg, #0a0a0a)' }} />
                  </div>
                )}
                <div className="text-2xl mb-2">{ICONS[pkg.icon || ''] || '📦'}</div>
                <h3 className="font-semibold text-sm md:text-base mb-2" style={{ color: 'var(--color-text, #f0f0f0)' }}>
                  {pkg.name}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {cats.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: 'var(--color-text-muted, #aaa)',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs" style={{ color: 'var(--color-text-muted, #666)' }}>
        You can add, rename, and create custom categories anytime.
      </p>

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ color: 'var(--color-text-muted, #888)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedPackageIds.length === 0}
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
