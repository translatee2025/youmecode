import { useEffect, useRef, useState } from 'react';
import { useWizardStore } from '@/stores/wizardStore';
import { useTenantStore } from '@/stores/tenantStore';
import { StepPlatformType } from './steps/StepPlatformType';
import { StepCategoryPackages } from './steps/StepCategoryPackages';
import { StepModules } from './steps/StepModules';
import { StepIdentity } from './steps/StepIdentity';
import { StepTheme } from './steps/StepTheme';
import { StepSummary } from './steps/StepSummary';

const STEP_LABELS = ['Type', 'Categories', 'Modules', 'Identity', 'Theme', 'Launch'];

export default function OnboardingWizard() {
  const { step, setStep } = useWizardStore();
  const tenant = useTenantStore((s) => s.tenant);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [animating, setAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goNext = () => {
    if (animating) return;
    setDirection('left');
    setAnimating(true);
    setTimeout(() => {
      setStep(step + 1);
      setAnimating(false);
    }, 300);
  };

  const goBack = () => {
    if (animating) return;
    setDirection('right');
    setAnimating(true);
    setTimeout(() => {
      setStep(step - 1);
      setAnimating(false);
    }, 300);
  };

  // Scroll to top on step change
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const renderStep = () => {
    switch (step) {
      case 1: return <StepPlatformType onNext={goNext} />;
      case 2: return <StepCategoryPackages onNext={goNext} onBack={goBack} />;
      case 3: return <StepModules onNext={goNext} onBack={goBack} />;
      case 4: return <StepIdentity onNext={goNext} onBack={goBack} />;
      case 5: return <StepTheme onNext={goNext} onBack={goBack} />;
      case 6: return <StepSummary onBack={goBack} />;
      default: return null;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg, #0a0a0a)' }}
    >
      {/* Top bar with logo */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: 'var(--color-primary, #fff)', color: 'var(--color-bg, #0a0a0a)' }}>
              N
            </div>
          )}
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-muted, #888)' }}>
            {tenant?.name || 'NexusOS'}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--color-text-muted, #666)' }}>
          Step {step} of 6
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-2">
        <div className="flex gap-1.5">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full h-1.5 rounded-full transition-all duration-500"
                style={{
                  background: i + 1 <= step
                    ? 'var(--color-primary, #fff)'
                    : 'var(--color-border, rgba(255,255,255,0.1))',
                }}
              />
              <span
                className="text-[10px] font-medium transition-colors"
                style={{
                  color: i + 1 <= step
                    ? 'var(--color-text, #f0f0f0)'
                    : 'var(--color-text-muted, #555)',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div
          className={`transition-all duration-300 ease-out ${
            animating
              ? direction === 'left'
                ? 'opacity-0 -translate-x-8'
                : 'opacity-0 translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
