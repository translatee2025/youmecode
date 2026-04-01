import { create } from 'zustand';

export interface ThemeColors {
  bg: string;
  cardBg: string;
  text: string;
  textMuted: string;
  primary: string;
  nav: string;
  button: string;
  border: string;
}

export interface WizardState {
  step: number;
  platformType: string | null;
  selectedPackageIds: string[];
  enabledModules: string[];
  homepageModule: string;
  platformName: string;
  tagline: string;
  logoUrl: string | null;
  subdomain: string;
  colors: ThemeColors;

  setStep: (step: number) => void;
  setPlatformType: (type: string) => void;
  setSelectedPackageIds: (ids: string[]) => void;
  togglePackage: (id: string) => void;
  setEnabledModules: (modules: string[]) => void;
  toggleModule: (key: string) => void;
  setHomepageModule: (key: string) => void;
  setPlatformName: (name: string) => void;
  setTagline: (tagline: string) => void;
  setLogoUrl: (url: string | null) => void;
  setSubdomain: (sub: string) => void;
  setColors: (colors: ThemeColors) => void;
  setColorKey: (key: keyof ThemeColors, value: string) => void;
}

const defaultColors: ThemeColors = {
  bg: '#0a0a0a',
  cardBg: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textMuted: '#888888',
  primary: '#ffffff',
  nav: 'rgba(10,10,10,0.85)',
  button: '#ffffff',
  border: 'rgba(255,255,255,0.1)',
};

export const useWizardStore = create<WizardState>((set) => ({
  step: 1,
  platformType: null,
  selectedPackageIds: [],
  enabledModules: [],
  homepageModule: '',
  platformName: '',
  tagline: '',
  logoUrl: null,
  subdomain: '',
  colors: { ...defaultColors },

  setStep: (step) => set({ step }),
  setPlatformType: (platformType) => set({ platformType }),
  setSelectedPackageIds: (selectedPackageIds) => set({ selectedPackageIds }),
  togglePackage: (id) =>
    set((s) => ({
      selectedPackageIds: s.selectedPackageIds.includes(id)
        ? s.selectedPackageIds.filter((p) => p !== id)
        : [...s.selectedPackageIds, id],
    })),
  setEnabledModules: (enabledModules) => set({ enabledModules }),
  toggleModule: (key) =>
    set((s) => ({
      enabledModules: s.enabledModules.includes(key)
        ? s.enabledModules.filter((m) => m !== key)
        : [...s.enabledModules, key],
    })),
  setHomepageModule: (homepageModule) => set({ homepageModule }),
  setPlatformName: (platformName) => set({ platformName }),
  setTagline: (tagline) => set({ tagline }),
  setLogoUrl: (logoUrl) => set({ logoUrl }),
  setSubdomain: (subdomain) => set({ subdomain }),
  setColors: (colors) => set({ colors }),
  setColorKey: (key, value) =>
    set((s) => ({ colors: { ...s.colors, [key]: value } })),
}));
