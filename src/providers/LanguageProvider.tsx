import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const profile = useAuthStore((s) => s.profile);
  const [lang, setLangState] = useState(
    () => localStorage.getItem('nexus_lang') || 'en'
  );
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [defaultTranslations, setDefaultTranslations] = useState<Record<string, string>>({});
  const [activeLanguages, setActiveLanguages] = useState<string[]>(['en']);
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [rtlLanguages, setRtlLanguages] = useState<string[]>([]);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('active_languages, default_language, rtl_languages')
        .maybeSingle();

      if (data) {
        const active = (data.active_languages as string[]) || ['en'];
        setActiveLanguages(active);
        setDefaultLanguage(data.default_language || 'en');
        setRtlLanguages((data.rtl_languages as string[]) || []);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      const { data } = await supabase
        .from('translations')
        .select('string_key, value')
        .eq('language_code', lang);

      const map: Record<string, string> = {};
      data?.forEach((row) => { map[row.string_key] = row.value; });
      setTranslations(map);

      if (lang !== defaultLanguage) {
        const { data: fallback } = await supabase
          .from('translations')
          .select('string_key, value')
          .eq('language_code', defaultLanguage);

        const fmap: Record<string, string> = {};
        fallback?.forEach((row) => { fmap[row.string_key] = row.value; });
        setDefaultTranslations(fmap);
      } else {
        setDefaultTranslations({});
      }
    };
    loadTranslations();
  }, [lang, defaultLanguage]);

  useEffect(() => {
    const isRtl = RTL_CODES.has(lang) || rtlLanguages.includes(lang);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang, rtlLanguages]);

  const setLang = useCallback(
    (code: string) => {
      setLangState(code);
      localStorage.setItem('nexus_lang', code);
      if (profile) {
        supabase.from('users').update({ preferred_language: code }).eq('id', profile.id).then();
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
