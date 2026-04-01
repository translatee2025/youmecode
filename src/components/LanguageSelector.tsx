import { useLanguage } from '@/providers/LanguageProvider';
import { LANGUAGES, getLanguageByCode } from '@/lib/languages';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSelector() {
  const { lang, setLang, activeLanguages } = useLanguage();
  const currentLang = getLanguageByCode(lang);

  const available = LANGUAGES.filter((l) => activeLanguages.includes(l.code));

  if (available.length <= 1) return null;

  return (
    <Select value={lang} onValueChange={setLang}>
      <SelectTrigger className="w-auto gap-2 border-none bg-transparent">
        <SelectValue>
          {currentLang ? `${currentLang.flag} ${currentLang.name}` : lang}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {available.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.flag} {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
