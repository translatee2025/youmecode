import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { RTL_CODES } from '@/lib/languages';

interface LanguageContextValue {
  lang: string;
  setLang: (code: string) => void;
  t: (key: string) => string;
  activeLanguages: string[];
  defaultLanguage: string;
  rtlLanguages: string[];
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  activeLanguages: ['en'],
  defaultLanguage: 'en',
  rtlLanguages: [],
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [lang, setLangState] = useState(
    () => localStorage.getItem('nexus_lang') || 'en'
  );
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [defaultTranslations, setDefaultTranslations] = useState<Record<string, string>>({});
  const [activeLanguages, setActiveLanguages] = useState<string[]>(['en']);
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [rtlLanguages, setRtlLanguages] = useState<string[]>([]);

  // Load site language settings
  useEffect(() => {
    if (!tenant) return;

    const loadSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('active_languages, default_language, rtl_languages')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (data) {
        const active = (data.active_languages as string[]) || ['en'];
        setActiveLanguages(active);
        setDefaultLanguage(data.default_language || 'en');
        setRtlLanguages((data.rtl_languages as string[]) || []);
      }
    };
    loadSettings();
  }, [tenant]);

  // Load translations for current language
  useEffect(() => {
    if (!tenant) return;

    const loadTranslations = async () => {
      const { data } = await supabase
        .from('translations')
        .select('string_key, value')
        .eq('tenant_id', tenant.id)
        .eq('language_code', lang);

      const map: Record<string, string> = {};
      data?.forEach((row) => { map[row.string_key] = row.value; });
      setTranslations(map);

      // Load default language fallback if different
      if (lang !== defaultLanguage) {
        const { data: fallback } = await supabase
          .from('translations')
          .select('string_key, value')
          .eq('tenant_id', tenant.id)
          .eq('language_code', defaultLanguage);

        const fmap: Record<string, string> = {};
        fallback?.forEach((row) => { fmap[row.string_key] = row.value; });
        setDefaultTranslations(fmap);
      } else {
        setDefaultTranslations({});
      }
    };
    loadTranslations();
  }, [tenant, lang, defaultLanguage]);

  // Set document direction
  useEffect(() => {
    const isRtl = RTL_CODES.has(lang) || rtlLanguages.includes(lang);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang, rtlLanguages]);

  const setLang = useCallback(
    (code: string) => {
      setLangState(code);
      localStorage.setItem('nexus_lang', code);
      // Update user preference if logged in
      if (profile) {
        supabase
          .from('users')
          .update({ preferred_language: code })
          .eq('id', profile.id)
          .then();
      }
    },
    [profile]
  );

  const t = useCallback(
    (key: string): string => {
      return translations[key] || defaultTranslations[key] || key;
    },
    [translations, defaultTranslations]
  );

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, t, activeLanguages, defaultLanguage, rtlLanguages }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
